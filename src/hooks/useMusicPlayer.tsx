import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { playlist } from "../data/playlist";
import { storageKeys } from "../data/site";
import type { Track } from "../types";
import { useAuth } from "./useAuth";
import { useSettings } from "./useSettings";

interface MusicPlayerContextValue {
  tracks: Track[];
  current: Track | null;
  currentIndex: number;
  isPlaying: boolean;
  /** seconds */
  progress: number;
  /** seconds */
  duration: number;
  volume: number;
  muted: boolean;
  hasError: boolean;
  playTrack: (id: string) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

/** How often the position is written to storage while playing. */
const SAVE_EVERY_MS = 4000;

/** A reload resumes the same track at roughly the same place. */
function readStoredPosition(): { index: number; time: number } {
  try {
    const id = window.localStorage.getItem(storageKeys.playerTrack);
    const rawTime = window.localStorage.getItem(storageKeys.playerTime);
    const time = rawTime === null ? 0 : Number(rawTime);
    const index = playlist.findIndex((track) => track.id === id);
    // A song that is no longer listed starts from the beginning, not from the
    // second an older playlist stopped on.
    if (index === -1) return { index: 0, time: 0 };
    return { index, time: Number.isFinite(time) && time > 0 ? time : 0 };
  } catch {
    return { index: 0, time: 0 };
  }
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { settings, update } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wantsPlayRef = useRef(false);
  // Read once, at mount: the saved track and the second it stopped on.
  const [boot] = useState(readStoredPosition);
  const pendingRestore = useRef(boot.time);

  const [currentIndex, setCurrentIndex] = useState(boot.index);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(boot.time);
  const [duration, setDuration] = useState(
    () => playlist[boot.index]?.duration ?? playlist[0]?.duration ?? 0,
  );
  const [muted, setMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  const current = playlist[currentIndex] ?? null;
  const volume = settings.volume;

  // The listeners are attached once, so they read the index through a ref.
  const indexRef = useRef(currentIndex);
  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  const persist = useCallback((index: number, time: number) => {
    try {
      window.localStorage.setItem(storageKeys.playerTrack, playlist[index]?.id ?? "");
      window.localStorage.setItem(storageKeys.playerTime, String(Math.floor(time)));
    } catch {
      // Storage may be blocked; playback is unaffected.
    }
  }, []);

  // Attach audio element listeners once.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let lastSaved = 0;

    const onTime = () => {
      setProgress(audio.currentTime);
      if (Date.now() - lastSaved > SAVE_EVERY_MS) {
        lastSaved = Date.now();
        persist(indexRef.current, audio.currentTime);
      }
    };
    const onMeta = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        // Resume where the last visit stopped, without starting playback.
        const pending = pendingRestore.current;
        if (pending > 0 && pending < audio.duration - 5) {
          audio.currentTime = pending;
          setProgress(pending);
        }
        pendingRestore.current = 0;
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      persist(indexRef.current, audio.currentTime);
    };
    const onError = () => {
      setHasError(true);
      setIsPlaying(false);
    };
    const onEnded = () => {
      if (playlist.length === 0) return;
      wantsPlayRef.current = true;
      setCurrentIndex((index) => (index + 1) % playlist.length);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
    };
  }, [persist]);

  // Keep the element volume in sync with settings.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
  }, [muted]);

  // A signed-in visit opens with the song already playing. Browsers refuse
  // sound until the page has been touched, so a refusal waits for the next
  // tap anywhere outside the player, whose own controls start it themselves.
  const autostarted = useRef(false);
  useEffect(() => {
    if (status !== "ready" || autostarted.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    autostarted.current = true;

    let alive = true;
    const start = () => {
      if (audio.paused) void audio.play().catch(() => undefined);
    };
    const unlock = (event: Event) => {
      const target = event.target;
      // Let the player's own buttons decide; a pointerdown here would start the
      // song and the click that follows would immediately pause it again.
      if (target instanceof Element && target.closest("[data-player]")) return;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      start();
    };

    void audio.play().catch(() => {
      if (!alive) return;
      window.addEventListener("pointerdown", unlock);
      window.addEventListener("keydown", unlock);
    });

    return () => {
      alive = false;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [status]);

  // Reset transport state when the track changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(0);
    setHasError(false);
    if (current?.duration) setDuration(current.duration);

    if (wantsPlayRef.current) {
      wantsPlayRef.current = false;
      void audio.play().catch(() => setHasError(true));
    }
  }, [current]);

  const playTrack = useCallback(
    (id: string) => {
      const index = playlist.findIndex((track) => track.id === id);
      if (index === -1) return;
      const audio = audioRef.current;
      wantsPlayRef.current = true;
      if (index === currentIndex) {
        void audio?.play().catch(() => setHasError(true));
        return;
      }
      setCurrentIndex(index);
    },
    [currentIndex],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      if (hasError) {
        audio.load();
        setHasError(false);
      }
      void audio.play().catch(() => setHasError(true));
    } else {
      audio.pause();
    }
  }, [current, hasError]);

  const next = useCallback(() => {
    if (playlist.length === 0) return;
    const audio = audioRef.current;
    wantsPlayRef.current = audio ? !audio.paused : false;
    setCurrentIndex((index) => (index + 1) % playlist.length);
  }, []);

  const previous = useCallback(() => {
    if (playlist.length === 0) return;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setProgress(0);
      return;
    }
    wantsPlayRef.current = audio ? !audio.paused : false;
    setCurrentIndex((index) => (index - 1 + playlist.length) % playlist.length);
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setProgress(seconds);
  }, []);

  const setVolume = useCallback((value: number) => update({ volume: value }), [update]);

  const toggleMute = useCallback(() => setMuted((current) => !current), []);

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
      tracks: playlist,
      current,
      currentIndex,
      isPlaying,
      progress,
      duration,
      volume,
      muted,
      hasError,
      playTrack,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
    }),
    [
      current,
      currentIndex,
      isPlaying,
      progress,
      duration,
      volume,
      muted,
      hasError,
      playTrack,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
    ],
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={current?.src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget;
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
          }
        }}
      />
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer(): MusicPlayerContextValue {
  const context = useContext(MusicPlayerContext);
  if (!context) throw new Error("useMusicPlayer must be used inside MusicPlayerProvider");
  return context;
}

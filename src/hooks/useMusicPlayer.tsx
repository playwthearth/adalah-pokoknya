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
import { useSettings } from "./useSettings";
import { useTracks } from "./useTracks";

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
  shuffle: boolean;
  playTrack: (id: string) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

/** How often the position is written to storage while playing. */
const SAVE_EVERY_MS = 4000;

/** A reload resumes the same track at roughly the same place. */
function readStoredPosition(): { id: string | null; time: number } {
  try {
    const id = window.localStorage.getItem(storageKeys.playerTrack);
    const rawTime = window.localStorage.getItem(storageKeys.playerTime);
    const time = rawTime === null ? 0 : Number(rawTime);
    return {
      id: id || null,
      time: Number.isFinite(time) && time > 0 ? time : 0,
    };
  } catch {
    return { id: null, time: 0 };
  }
}

function readStoredShuffle(): boolean {
  try {
    return window.localStorage.getItem(storageKeys.playerShuffle) === "1";
  } catch {
    return false;
  }
}

/** A random track that is not the one already playing. */
function shuffledPick(tracks: Track[], exclude: number): string | null {
  if (tracks.length === 0) return null;
  if (tracks.length === 1) return tracks[0].id;
  let index = exclude;
  while (index === exclude) index = Math.floor(Math.random() * tracks.length);
  return tracks[index].id;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const { settings, update } = useSettings();
  const { uploaded, loading: tracksLoading } = useTracks();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wantsPlayRef = useRef(false);
  // Read once, at mount: the saved track and the second it stopped on.
  const [boot] = useState(readStoredPosition);
  const pendingRestore = useRef(boot.time);

  const tracks = useMemo<Track[]>(() => [...playlist, ...uploaded], [uploaded]);

  const [currentId, setCurrentId] = useState<string | null>(boot.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(boot.time);
  const [shuffle, setShuffle] = useState(readStoredShuffle);
  const [muted, setMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [duration, setDuration] = useState(0);

  // Any track that no longer exists — or that has not loaded yet — falls back
  // to the first one, so the player is never pointed at nothing.
  const foundIndex = tracks.findIndex((track) => track.id === currentId);
  const currentIndex = foundIndex === -1 ? 0 : foundIndex;
  const current = tracks[currentIndex] ?? null;

  const volume = settings.volume;

  // The listeners are attached once, so they read the moving parts through refs.
  const indexRef = useRef(currentIndex);
  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);
  const tracksRef = useRef(tracks);
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);
  const shuffleRef = useRef(shuffle);
  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  /** The id that follows `from` in the current order. */
  const nextIdFrom = useCallback((from: number): string | null => {
    const list = tracksRef.current;
    if (list.length === 0) return null;
    if (shuffleRef.current) return shuffledPick(list, from);
    return list[(from + 1) % list.length].id;
  }, []);

  const persist = useCallback((id: string | null, time: number) => {
    try {
      window.localStorage.setItem(storageKeys.playerTrack, id ?? "");
      window.localStorage.setItem(storageKeys.playerTime, String(Math.floor(time)));
    } catch {
      // Storage may be blocked; playback is unaffected.
    }
  }, []);

  // A stored song that is not in the library yet (or any more) starts at the
  // first track once the shared library has loaded — not before, or a resumed
  // upload would be replaced by the first of the bundled songs.
  useEffect(() => {
    if (tracksLoading || tracks.length === 0) return;
    if (currentId && tracks.some((track) => track.id === currentId)) return;
    setCurrentId(tracks[0].id);
  }, [tracks, currentId, tracksLoading]);

  // Attach audio element listeners once.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let lastSaved = 0;

    const onTime = () => {
      setProgress(audio.currentTime);
      if (Date.now() - lastSaved > SAVE_EVERY_MS) {
        lastSaved = Date.now();
        persist(indexRef.current >= 0 ? (tracksRef.current[indexRef.current]?.id ?? null) : null, audio.currentTime);
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
      persist(tracksRef.current[indexRef.current]?.id ?? null, audio.currentTime);
    };
    const onError = () => {
      setHasError(true);
      setIsPlaying(false);
    };
    const onEnded = () => {
      const id = nextIdFrom(indexRef.current);
      if (!id) return;
      wantsPlayRef.current = true;
      setCurrentId(id);
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
  }, [persist, nextIdFrom]);

  // Keep the element volume in sync with settings.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
  }, [muted]);

  // Reset transport state when the track changes — not when a signed link is
  // refreshed under the same song.
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
  }, [current?.id, current?.duration]);

  const playTrack = useCallback(
    (id: string) => {
      const index = tracks.findIndex((track) => track.id === id);
      if (index === -1) return;
      const audio = audioRef.current;
      wantsPlayRef.current = true;
      if (id === current?.id) {
        void audio?.play().catch(() => setHasError(true));
        return;
      }
      setCurrentId(id);
    },
    [tracks, current?.id],
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
    const id = nextIdFrom(currentIndex);
    if (!id) return;
    const audio = audioRef.current;
    wantsPlayRef.current = audio ? !audio.paused : false;
    setCurrentId(id);
  }, [currentIndex, nextIdFrom]);

  const previous = useCallback(() => {
    if (tracks.length === 0) return;
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setProgress(0);
      return;
    }
    wantsPlayRef.current = audio ? !audio.paused : false;
    setCurrentId(tracks[(currentIndex - 1 + tracks.length) % tracks.length].id);
  }, [currentIndex, tracks]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setProgress(seconds);
  }, []);

  const setVolume = useCallback((value: number) => update({ volume: value }), [update]);

  const toggleMute = useCallback(() => setMuted((current) => !current), []);

  const toggleShuffle = useCallback(() => {
    setShuffle((current) => {
      const nextValue = !current;
      try {
        window.localStorage.setItem(storageKeys.playerShuffle, nextValue ? "1" : "0");
      } catch {
        // Device-only preference; playback does not depend on it.
      }
      return nextValue;
    });
  }, []);

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
      tracks,
      current,
      currentIndex,
      isPlaying,
      progress,
      duration,
      volume,
      muted,
      hasError,
      shuffle,
      playTrack,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
    }),
    [
      tracks,
      current,
      currentIndex,
      isPlaying,
      progress,
      duration,
      volume,
      muted,
      hasError,
      shuffle,
      playTrack,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
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

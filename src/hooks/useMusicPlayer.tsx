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
import type { Track } from "../types";
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
  hasError: boolean;
  playTrack: (id: string) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const { settings, update } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wantsPlayRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(playlist[0]?.duration ?? 0);
  const [hasError, setHasError] = useState(false);

  const current = playlist[currentIndex] ?? null;
  const volume = settings.volume;

  // Attach audio element listeners once.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
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
  }, []);

  // Keep the element volume in sync with settings.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

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

  const playTrack = useCallback((id: string) => {
    const index = playlist.findIndex((track) => track.id === id);
    if (index === -1) return;
    const audio = audioRef.current;
    wantsPlayRef.current = true;
    if (index === currentIndex) {
      void audio?.play().catch(() => setHasError(true));
      return;
    }
    setCurrentIndex(index);
  }, [currentIndex]);

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

  const setVolume = useCallback(
    (value: number) => update({ volume: value }),
    [update],
  );

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
      tracks: playlist,
      current,
      currentIndex,
      isPlaying,
      progress,
      duration,
      volume,
      hasError,
      playTrack,
      toggle,
      next,
      previous,
      seek,
      setVolume,
    }),
    [
      current,
      currentIndex,
      isPlaying,
      progress,
      duration,
      volume,
      hasError,
      playTrack,
      toggle,
      next,
      previous,
      seek,
      setVolume,
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

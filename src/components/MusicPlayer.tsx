import type { CSSProperties } from "react";
import {
  AlertCircle,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume1,
  VolumeX,
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { useMusicPlayer } from "../hooks/useMusicPlayer";
import { formatDuration } from "../utils/format";
import { PlayerArtwork } from "./PlayerArtwork";

export function MusicPlayer() {
  const { t } = useLanguage();
  const {
    tracks,
    current,
    currentIndex,
    isPlaying,
    progress,
    duration,
    volume,
    muted,
    hasError,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
  } = useMusicPlayer();

  const percent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;
  const fillStyle = { "--fill": `${percent}%` } as CSSProperties;

  return (
    <section
      aria-label={t.playlist.nowPlaying}
      className="surface grid grid-cols-1 gap-6 p-5 sm:gap-8 sm:p-7 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:items-center md:gap-10"
    >
      <div className="flex justify-center md:block">
        <PlayerArtwork
          index={currentIndex}
          active={isPlaying}
          title={current?.title}
          className="w-48 max-w-[260px] sm:w-60 md:w-full"
        />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                isPlaying ? "bg-ember signal-dot" : "bg-muted/50"
              }`}
            />
            {t.playlist.nowPlaying}
          </p>
          <span className="label">
            {String(currentIndex + 1).padStart(2, "0")} /{" "}
            {String(tracks.length).padStart(2, "0")}
          </span>
        </div>

        <h2 className="mt-5 truncate font-display text-3xl font-extralight text-ink sm:text-4xl">
          {current?.title ?? t.playlist.empty}
        </h2>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-strong">
          {current?.artist ?? "—"}
        </p>

        {hasError && (
          <p className="mt-4 flex items-center gap-2 text-xs text-ember">
            <AlertCircle size={13} strokeWidth={1.5} aria-hidden="true" />
            {t.playlist.trackError}
          </p>
        )}

        <div className="mt-8">
          <label className="sr-only" htmlFor="track-progress">
            {t.playlist.nowPlaying}
          </label>
          <input
            id="track-progress"
            type="range"
            className="range"
            min={0}
            max={Math.max(duration, 0.1)}
            step={0.1}
            value={Math.min(progress, duration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            style={fillStyle}
            disabled={!current}
          />
          <div className="mt-2 flex items-center justify-between font-mono text-[10px] tabular-nums tracking-widest text-muted-strong">
            <span>{formatDuration(progress)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={previous}
              aria-label={t.playlist.previous}
              className="inline-flex h-11 w-11 items-center justify-center border border-line text-navy transition-colors hover:border-navy/40 hover:bg-surface/50"
            >
              <SkipBack size={15} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-label={isPlaying ? t.playlist.pause : t.playlist.play}
              className="inline-flex h-14 w-14 items-center justify-center border border-navy bg-navy text-mist transition-colors hover:bg-ink active:scale-[0.98]"
            >
              {isPlaying ? (
                <Pause size={19} strokeWidth={1.5} fill="currentColor" />
              ) : (
                <Play size={19} strokeWidth={1.5} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={t.playlist.next}
              className="inline-flex h-11 w-11 items-center justify-center border border-line text-navy transition-colors hover:border-navy/40 hover:bg-surface/50"
            >
              <SkipForward size={15} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex min-w-[140px] flex-1 items-center gap-3 sm:max-w-[200px]">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? t.playlist.unmute : t.playlist.mute}
              aria-pressed={muted}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-line/80 text-navy/75 transition-colors hover:border-navy/40 hover:text-ink"
            >
              {muted ? (
                <VolumeX size={15} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Volume1 size={15} strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
            <label className="sr-only" htmlFor="player-volume">
              {t.playlist.volume}
            </label>
            <input
              id="player-volume"
              type="range"
              className="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              style={{ "--fill": `${volume * 100}%` } as CSSProperties}
            />
            <span className="w-8 shrink-0 text-right font-mono text-[10px] tabular-nums text-muted-strong">
              {Math.round(volume * 100)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

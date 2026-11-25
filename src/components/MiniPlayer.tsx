import { ListMusic, Pause, Play, SkipForward } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { useMusicPlayer } from "../hooks/useMusicPlayer";
import { formatDuration } from "../utils/format";

interface MiniPlayerProps {
  onOpenPlaylist: () => void;
}

export function MiniPlayer({ onOpenPlaylist }: MiniPlayerProps) {
  const { t } = useLanguage();
  const { current, isPlaying, toggle, next, progress, duration } = useMusicPlayer();
  const percent = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <div
      data-player=""
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-[10px] border border-b-0 border-line/80 bg-mist/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_40px_-36px_rgba(119,125,170,0.9)] backdrop-blur-md"
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-line/70">
        <div
          className="h-px bg-plum/70 transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mx-auto flex h-[64px] max-w-6xl items-center gap-3 px-4 sm:gap-5 sm:px-8">
        <span
          aria-hidden="true"
          className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isPlaying ? "vinyl-spin" : ""
          }`}
        >
          <span className="vinyl-disc absolute inset-0 rounded-full" />
          <span className="relative h-2 w-2 rounded-full bg-lavender ring-1 ring-white/50" />
        </span>

        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? t.playlist.pause : t.playlist.play}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-plum/40 text-navy transition-colors hover:border-plum hover:bg-navy hover:text-mist"
        >
          {isPlaying ? (
            <Pause size={13} strokeWidth={1.5} fill="currentColor" />
          ) : (
            <Play size={13} strokeWidth={1.5} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-normal tracking-wide text-navy">
            {current?.title ?? t.playlist.empty}
          </p>
          <p className="label truncate text-[9px] tracking-[0.18em]">
            {current?.artist ?? "—"} · {formatDuration(progress)}
          </p>
        </div>

        <button
          type="button"
          onClick={next}
          aria-label={t.playlist.next}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-muted-strong transition-colors hover:text-ink"
        >
          <SkipForward size={15} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          onClick={onOpenPlaylist}
          aria-label={t.playlist.openPlayer}
          className="hidden shrink-0 items-center gap-2 border border-line/80 px-3.5 py-2.5 text-muted-strong transition-colors hover:border-navy/30 hover:text-ink sm:inline-flex"
        >
          <ListMusic size={13} strokeWidth={1.5} aria-hidden="true" />
          <span className="label tracking-[0.18em]">{t.nav.playlist}</span>
        </button>

        <button
          type="button"
          onClick={onOpenPlaylist}
          aria-label={t.playlist.openPlayer}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-line/80 text-muted-strong transition-colors hover:border-navy/30 hover:text-ink sm:hidden"
        >
          <ListMusic size={15} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

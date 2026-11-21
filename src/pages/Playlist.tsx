import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { MusicPlayer } from "../components/MusicPlayer";
import { Reveal } from "../components/Reveal";
import { SectionHeader } from "../components/SectionHeader";
import { useLanguage } from "../hooks/useLanguage";
import { useMusicPlayer } from "../hooks/useMusicPlayer";
import { formatDuration } from "../utils/format";

export function Playlist() {
  const { t } = useLanguage();
  const { tracks, currentIndex, isPlaying, playTrack, toggle } = useMusicPlayer();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <SectionHeader
        eyebrow={t.playlist.eyebrow}
        title={t.playlist.title}
        jp="音楽"
        description={t.playlist.description}
        aside={<span className="label">{t.nav.playlist}</span>}
      />

      <Reveal className="mt-9" immediate>
        {tracks.length === 0 ? (
          <EmptyState title={t.playlist.empty} hint={t.playlist.emptyHint} />
        ) : (
          <MusicPlayer />
        )}
      </Reveal>

      <section className="mt-14" aria-label={t.playlist.playlistLabel}>
        <div className="flex items-baseline justify-between gap-4">
          <p className="label">{t.playlist.playlistLabel}</p>
          <span className="font-mono text-[10px] tabular-nums tracking-[0.16em] text-muted">
            {String(tracks.length).padStart(2, "0")} TRACKS
          </span>
        </div>

        <ol className="mt-4 border-b border-line/70">
          {tracks.map((track, index) => {
            const active = index === currentIndex;
            const playing = active && isPlaying;
            return (
              <li key={track.id}>
                <button
                  type="button"
                  onClick={() => (active ? toggle() : playTrack(track.id))}
                  aria-label={`${t.playlist.select}: ${track.title}`}
                  aria-current={active ? "true" : undefined}
                  className={`group flex w-full items-center gap-4 border-t border-line/70 py-4 text-left transition-colors hover:bg-white/45 sm:gap-6 ${
                    active ? "bg-white/35" : ""
                  }`}
                >
                  <span className="flex w-6 shrink-0 items-center justify-center">
                    {playing ? (
                      <span className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
                        {[0, 1, 2].map((bar) => (
                          <span
                            key={bar}
                            className="eq-bar h-full w-[2px] bg-ember/80"
                            style={{ animationDelay: `${bar * 0.18}s` }}
                          />
                        ))}
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-muted/80">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate font-display text-base font-light ${
                        active ? "text-ink" : "text-navy/85"
                      }`}
                    >
                      {track.title}
                    </span>
                    <span className="label mt-1 block truncate text-[9px]">{track.artist}</span>
                  </span>

                  <span className="hidden font-mono text-[10px] tabular-nums text-muted sm:block">
                    {formatDuration(track.duration ?? 0)}
                  </span>

                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center border transition-colors ${
                      active
                        ? "border-navy text-navy"
                        : "border-line text-muted group-hover:border-navy/40 group-hover:text-navy"
                    }`}
                  >
                    {playing ? (
                      <Pause size={12} strokeWidth={1.5} fill="currentColor" />
                    ) : (
                      <Play size={12} strokeWidth={1.5} fill="currentColor" />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 max-w-xl text-[11px] leading-relaxed text-muted/80"
        >
          {t.playlist.placeholderNote}
        </motion.p>
      </section>
    </div>
  );
}

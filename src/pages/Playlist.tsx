import { motion } from "framer-motion";
import { Loader2, Pause, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { MusicPlayer } from "../components/MusicPlayer";
import { Reveal } from "../components/Reveal";
import { SectionHeader } from "../components/SectionHeader";
import { SongUpload } from "../components/SongUpload";
import { useLanguage } from "../hooks/useLanguage";
import { useMusicPlayer } from "../hooks/useMusicPlayer";
import { useTracks } from "../hooks/useTracks";
import type { Track } from "../types";
import { formatDuration } from "../utils/format";

export function Playlist() {
  const { t } = useLanguage();
  const { tracks, currentIndex, isPlaying, playTrack, toggle } = useMusicPlayer();
  const { removeTrack } = useTracks();
  const [adding, setAdding] = useState(false);
  /** Two taps to remove an uploaded song: the first arms it, the second acts. */
  const [confirming, setConfirming] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = async (track: Track) => {
    if (removing) return;
    if (confirming !== track.id) {
      setConfirming(track.id);
      setError(null);
      return;
    }
    setRemoving(track.id);
    setError(null);
    try {
      await removeTrack(track);
      setConfirming(null);
    } catch (failure) {
      console.error("[tracks] remove failed", failure);
      setError(t.playlist.removeError);
    } finally {
      setRemoving(null);
    }
  };

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label">{t.playlist.playlistLabel}</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tabular-nums tracking-[0.16em] text-muted-strong">
              {String(tracks.length).padStart(2, "0")} {t.playlist.tracksLabel}
            </span>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex min-h-11 items-center gap-2 border border-navy/50 px-3.5 text-[10px] uppercase tracking-[0.18em] text-navy transition-colors hover:bg-navy hover:text-mist"
            >
              <Plus size={13} strokeWidth={1.5} aria-hidden="true" />
              {t.playlist.add}
            </button>
          </div>
        </div>

        <ol className="mt-4 border-b border-line/70">
          {tracks.map((track, index) => {
            const active = index === currentIndex;
            const playing = active && isPlaying;
            return (
              <li key={track.id} className="flex items-stretch border-t border-line/70">
                <button
                  type="button"
                  onClick={() => (active ? toggle() : playTrack(track.id))}
                  aria-label={`${t.playlist.select}: ${track.title}`}
                  aria-current={active ? "true" : undefined}
                  className={`group relative flex min-w-0 flex-1 items-center gap-4 overflow-hidden py-4 text-left transition-colors hover:bg-surface/60 sm:gap-6 ${
                    active ? "bg-surface/40" : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-0 left-0 w-px bg-ember transition-transform duration-500 ${
                      active ? "scale-y-100" : "scale-y-0"
                    }`}
                  />
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
                      <span className="font-mono text-[10px] text-muted-strong">
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
                    <span className="label mt-1 block truncate text-[9px]">
                      {track.artist || "—"}
                      {track.uploaded && (
                        <span className="ml-2 text-plum">· {t.playlist.uploaded}</span>
                      )}
                    </span>
                  </span>

                  <span className="hidden font-mono text-[10px] tabular-nums text-muted-strong sm:block">
                    {formatDuration(track.duration ?? 0)}
                  </span>

                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center border transition-colors ${
                      active
                        ? "border-navy text-navy"
                        : "border-line text-muted-strong group-hover:border-navy/40 group-hover:text-navy"
                    }`}
                  >
                    {playing ? (
                      <Pause size={12} strokeWidth={1.5} fill="currentColor" />
                    ) : (
                      <Play size={12} strokeWidth={1.5} fill="currentColor" />
                    )}
                  </span>
                </button>

                {track.uploaded && (
                  <button
                    type="button"
                    onClick={() => void remove(track)}
                    disabled={removing === track.id}
                    aria-label={`${
                      confirming === track.id ? t.playlist.confirmRemove : t.playlist.removeSong
                    }: ${track.title}`}
                    className={`ml-1 inline-flex w-11 shrink-0 items-center justify-center transition-colors disabled:opacity-60 ${
                      confirming === track.id
                        ? "text-ember"
                        : "text-muted-strong hover:text-ember"
                    }`}
                  >
                    {removing === track.id ? (
                      <Loader2 size={14} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        {error && (
          <p role="alert" className="mt-3 text-[11px] text-ember">
            {error}
          </p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 max-w-xl text-[11px] leading-relaxed text-muted-strong"
        >
          {t.playlist.placeholderNote}
        </motion.p>
      </section>

      <SongUpload open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

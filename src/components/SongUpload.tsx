import { Loader2, Music2, Upload } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useMusicPlayer } from "../hooks/useMusicPlayer";
import { MAX_TRACK_BYTES, isSupportedAudio, useTracks } from "../hooks/useTracks";
import { formatDuration } from "../utils/format";
import { Modal } from "./Modal";

interface SongUploadProps {
  open: boolean;
  onClose: () => void;
}

const fieldClass =
  "w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-ink outline-none transition-colors placeholder:text-muted-strong focus:border-navy sm:text-sm";

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border px-4 text-[10px] uppercase tracking-[0.18em] transition-colors";

/**
 * Reads the length before uploading, so the list can show a time straight
 * away. A browser that cannot decode the file (an unusual FLAC, say) simply
 * returns null and the player fills it in later.
 */
function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    let settled = false;

    const finish = (value: number | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      audio.removeAttribute("src");
      URL.revokeObjectURL(url);
      resolve(value);
    };

    const timer = window.setTimeout(() => finish(null), 8000);

    audio.preload = "metadata";
    audio.onloadedmetadata = () =>
      finish(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null);
    audio.onerror = () => finish(null);
    audio.src = url;
  });
}

export function SongUpload({ open, onClose }: SongUploadProps) {
  const { t } = useLanguage();
  const { addTrack } = useTracks();
  const { playTrack } = useMusicPlayer();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [length, setLength] = useState<number | null>(null);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setTitle("");
    setArtist("");
    setLength(null);
    setReading(false);
    setError(null);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const choose = (picked: File | null) => {
    setError(null);
    if (!picked) return;
    if (!isSupportedAudio(picked)) {
      setError(t.playlist.uploadError);
      return;
    }

    setFile(picked);
    setTitle(
      (current) =>
        current.trim() ||
        picked.name
          .replace(/\.[^.]+$/, "")
          .replace(/[_-]+/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
    );
    setLength(null);
    setReading(true);
    void readDuration(picked).then((seconds) => {
      setLength(seconds);
      setReading(false);
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !file) return;
    setBusy(true);
    setError(null);
    try {
      const track = await addTrack({ title, artist, file, duration: length });
      if (track.src) playTrack(track.id);
      reset();
      onClose();
    } catch (failure) {
      console.error("[tracks] upload failed", failure);
      setError(t.playlist.saveSongError);
    } finally {
      setBusy(false);
    }
  };

  const megabytes = file ? Math.max(0.1, file.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <Modal
      open={open}
      onClose={close}
      label={t.playlist.addTitle}
      labelledBy="song-upload-title"
      closeLabel={t.common.close}
    >
      <form onSubmit={submit} className="flex flex-col">
        <header className="border-b border-line/70 px-5 py-5 sm:px-8 sm:py-6">
          <p className="label">{t.playlist.eyebrow}</p>
          <h2 id="song-upload-title" className="mt-2 font-display text-2xl text-ink sm:text-3xl">
            {t.playlist.addTitle}
          </h2>
          <p className="mt-2 max-w-md text-[11px] leading-relaxed text-muted-strong">
            {t.playlist.addHint}
          </p>
        </header>

        <div className="px-5 py-5 sm:px-8 sm:py-6">
          <input
            ref={fileInput}
            type="file"
            accept="audio/*,.mp3,.m4a,.mp4,.aac,.flac,.wav,.ogg,.oga,.opus,.webm"
            className="sr-only"
            onChange={(event) => {
              choose(event.target.files?.[0] ?? null);
              // Allow choosing the same file again after a failure.
              event.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full items-center gap-4 border border-dashed border-line bg-pale/60 px-4 py-4 text-left transition-colors hover:border-navy/40 hover:bg-lavender/30"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-line/80 text-navy">
              <Music2 size={16} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ink">
                {file ? file.name : t.playlist.noFile}
              </span>
              <span className="label mt-1 block text-[9px] normal-case tracking-[0.08em]">
                {file
                  ? `${megabytes} MB${length ? ` · ${formatDuration(length)}` : ""}`
                  : t.playlist.chooseFile}
              </span>
            </span>
            {reading ? (
              <Loader2 size={15} strokeWidth={1.5} className="animate-spin text-navy" aria-hidden="true" />
            ) : (
              <Upload size={15} strokeWidth={1.5} className="text-muted-strong" aria-hidden="true" />
            )}
          </button>
          <p className="label mt-2 text-[9px] normal-case tracking-[0.08em]">
            {t.playlist.fileHint} · {Math.round(MAX_TRACK_BYTES / (1024 * 1024))} MB
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="song-title" className="label block">
                {t.playlist.titleLabel}
              </label>
              <input
                id="song-title"
                type="text"
                maxLength={160}
                autoComplete="off"
                value={title}
                placeholder={t.playlist.titlePlaceholder}
                onChange={(event) => setTitle(event.target.value)}
                className={`${fieldClass} mt-2`}
              />
            </div>

            <div>
              <label htmlFor="song-artist" className="label block">
                {t.playlist.artistLabel}
              </label>
              <input
                id="song-artist"
                type="text"
                maxLength={160}
                autoComplete="off"
                value={artist}
                placeholder={t.playlist.artistPlaceholder}
                onChange={(event) => setArtist(event.target.value)}
                className={`${fieldClass} mt-2`}
              />
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="px-5 pb-2 text-[11px] leading-relaxed text-ember sm:px-8">
            {error}
          </p>
        )}

        <footer className="flex flex-wrap items-center gap-3 border-t border-line/70 px-5 py-4 sm:border-0 sm:px-8 sm:pb-7 sm:pt-2">
          <button
            type="submit"
            disabled={busy || !file || reading}
            className={`${actionClass} flex-1 border-navy/70 font-mono text-navy hover:bg-navy hover:text-mist disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none`}
          >
            {busy && (
              <Loader2 size={12} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
            )}
            {busy ? t.playlist.savingSong : t.playlist.saveSong}
          </button>
          <button
            type="button"
            onClick={close}
            className={`${actionClass} border-line text-navy/70 hover:border-navy/40 hover:text-ink`}
          >
            {t.common.cancel}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

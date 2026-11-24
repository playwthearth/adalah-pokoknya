import { Crop, Loader2, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { MAX_PHOTO_BYTES, type MemoryDraft } from "../hooks/useMemories";
import { useLanguage } from "../hooks/useLanguage";
import type { Memory } from "../types";
import { PhotoCropper } from "./PhotoCropper";

interface MemoryEditorProps {
  /** The memory being changed, or null for a new one. */
  memory: Memory | null;
  onClose: () => void;
  onSave: (draft: MemoryDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const fieldClass =
  "w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-ink outline-none transition-colors placeholder:text-muted-strong focus:border-navy sm:text-sm";

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border px-4 text-[10px] uppercase tracking-[0.18em] transition-colors";

export function MemoryEditor({ memory, onClose, onSave, onDelete }: MemoryEditorProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(memory?.title ?? "");
  const [note, setNote] = useState(memory?.note ?? "");
  const [date, setDate] = useState(memory?.date ?? new Date().toISOString().slice(0, 10));
  const [photo, setPhoto] = useState<File | null>(null);
  /** A file or existing photo being framed before it becomes the memory's photo. */
  const [cropSource, setCropSource] = useState<File | string | null>(null);
  /** Bumped per photo so the cropper starts from a clean frame. */
  const [cropKey, setCropKey] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // A freshly chosen file wins over the photo that is already saved.
  const preview = useMemo(
    () => (photo ? URL.createObjectURL(photo) : (memory?.image ?? null)),
    [photo, memory?.image],
  );

  useEffect(() => {
    if (photo && preview) {
      const url = preview;
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [photo, preview]);

  // The sheet covers the page, so the archive behind it must not scroll.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || busy) return;
      // Escape first steps out of cropping, then out of the whole sheet.
      if (cropSource) setCropSource(null);
      else onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, cropSource, onClose]);

  const chooseFile = (file: File | null) => {
    setError(null);
    if (!file) {
      setPhoto(null);
      return;
    }
    if (!file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES) {
      setError(t.memories.uploadError);
      return;
    }
    setCropSource(file);
    setCropKey((current) => current + 1);
  };

  /** Reopens the current photo (new or saved) so it can be reframed. */
  const adjust = async () => {
    const url = photo ? preview : memory?.image;
    if (!url || preparing) return;
    setError(null);
    setPreparing(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("photo could not be loaded");
      const blob = await response.blob();
      setCropSource(new File([blob], "memory.jpg", { type: blob.type || "image/jpeg" }));
      setCropKey((current) => current + 1);
    } catch (failure) {
      console.error("[memories] photo could not be reopened", failure);
      setError(t.memories.cropError);
    } finally {
      setPreparing(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !title.trim() || !date) return;
    setBusy(true);
    setError(null);
    try {
      await onSave({ title, note, date, photo });
      onClose();
    } catch (failure) {
      console.error("[memories] save failed", failure);
      setError(t.memories.saveError);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onDelete();
      onClose();
    } catch (failure) {
      console.error("[memories] delete failed", failure);
      setError(t.memories.deleteError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[88] overflow-y-auto overscroll-contain bg-navy/40 sm:flex sm:items-start sm:justify-center sm:p-8 sm:backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={memory ? t.memories.editing : t.memories.creating}
    >
      <form
        onSubmit={submit}
        className="flex min-h-[100dvh] w-full flex-col bg-mist sm:min-h-0 sm:max-w-xl sm:border sm:border-line sm:shadow-[0_30px_80px_-40px_rgba(34,58,79,0.5)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line/70 px-5 py-4 sm:border-0 sm:p-8 sm:pb-0">
          <p className="label pt-2">{memory ? t.memories.editing : t.memories.creating}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-line text-navy transition-colors hover:border-navy/40"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 px-5 py-5 sm:px-8 sm:py-6">
          {cropSource ? (
            <PhotoCropper
              key={cropKey}
              source={cropSource}
              onCancel={() => setCropSource(null)}
              onConfirm={(file) => {
                setPhoto(file);
                setCropSource(null);
              }}
            />
          ) : (
            <div className="border border-line/80 bg-pale">
              {preview ? (
                <img
                  src={preview}
                  alt=""
                  width={1184}
                  height={880}
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center">
                  <span className="label text-[9px]">{t.memories.noPhoto}</span>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              chooseFile(event.target.files?.[0] ?? null);
              // Allow picking the same file again after a failed attempt.
              event.target.value = "";
            }}
          />
          {!cropSource && (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className={`${actionClass} w-full border-line text-navy/75 hover:border-navy/40 hover:text-ink sm:w-auto`}
                >
                  <Upload size={13} strokeWidth={1.5} aria-hidden="true" />
                  {preview ? t.memories.changePhoto : t.memories.addPhoto}
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={() => void adjust()}
                    disabled={preparing}
                    className={`${actionClass} w-full border-line text-navy/75 hover:border-navy/40 hover:text-ink disabled:opacity-60 sm:w-auto`}
                  >
                    {preparing ? (
                      <Loader2 size={13} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Crop size={13} strokeWidth={1.5} aria-hidden="true" />
                    )}
                    {t.memories.adjust}
                  </button>
                )}
              </div>
              <p className="label mt-2 text-[9px] normal-case tracking-[0.08em]">
                {t.memories.photoHint}
                {photo &&
                  ` · ${Math.max(1, Math.round(photo.size / 1024))} ${t.memories.kb}`}
              </p>
            </>
          )}

          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="memory-title" className="label block">
                {t.memories.titleLabel}
              </label>
              <input
                id="memory-title"
                type="text"
                required
                maxLength={120}
                autoComplete="off"
                value={title}
                placeholder={t.memories.titlePlaceholder}
                onChange={(event) => setTitle(event.target.value)}
                className={`${fieldClass} mt-2`}
              />
            </div>

            <div>
              <label htmlFor="memory-date" className="label block">
                {t.memories.dateLabel}
              </label>
              <input
                id="memory-date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={`${fieldClass} mt-2 min-w-0 font-mono text-base sm:max-w-[220px] sm:text-[12px]`}
              />
            </div>

            <div>
              <label htmlFor="memory-note" className="label block">
                {t.memories.noteLabel}
              </label>
              <textarea
                id="memory-note"
                rows={4}
                maxLength={2000}
                value={note}
                placeholder={t.memories.notePlaceholder}
                onChange={(event) => setNote(event.target.value)}
                className={`${fieldClass} mt-2 resize-y leading-relaxed`}
              />
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="px-5 pb-2 text-[11px] leading-relaxed text-ember sm:px-8">
            {error}
          </p>
        )}

        <footer className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line/70 bg-mist/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-8 sm:py-6 sm:pb-8">
          <button
            type="submit"
            disabled={busy || !title.trim() || !date}
            className={`${actionClass} flex-1 border-navy/70 font-mono text-navy hover:bg-navy hover:text-mist disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none`}
          >
            {busy && (
              <Loader2 size={12} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
            )}
            {busy ? t.memories.saving : t.memories.save}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`${actionClass} border-line text-navy/70 hover:border-navy/40 hover:text-ink`}
          >
            {t.memories.cancel}
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              className={`${actionClass} ml-auto border-transparent px-2 hover:text-ember ${
                confirming ? "text-ember" : "text-muted-strong"
              }`}
            >
              <Trash2 size={13} strokeWidth={1.5} aria-hidden="true" />
              {confirming ? t.memories.confirmDelete : t.memories.delete}
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}

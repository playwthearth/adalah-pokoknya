import { Loader2, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { MemoryDraft } from "../hooks/useMemories";
import { useLanguage } from "../hooks/useLanguage";
import type { Memory } from "../types";

interface MemoryEditorProps {
  /** The memory being changed, or null for a new one. */
  memory: Memory | null;
  onClose: () => void;
  onSave: (draft: MemoryDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const fieldClass =
  "w-full border-0 border-b border-line bg-transparent py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted-strong focus:border-navy";

export function MemoryEditor({ memory, onClose, onSave, onDelete }: MemoryEditorProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(memory?.title ?? "");
  const [note, setNote] = useState(memory?.note ?? "");
  const [date, setDate] = useState(memory?.date ?? new Date().toISOString().slice(0, 10));
  const [photo, setPhoto] = useState<File | null>(null);
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

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
      className="fixed inset-0 z-[88] overflow-y-auto bg-navy/30 px-4 py-6 backdrop-blur-sm sm:px-8 sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-label={memory ? t.memories.editing : t.memories.creating}
    >
      <form
        onSubmit={submit}
        className="mx-auto w-full max-w-xl border border-line bg-mist p-5 shadow-[0_30px_80px_-40px_rgba(34,58,79,0.5)] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="label">{memory ? t.memories.editing : t.memories.creating}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="inline-flex h-8 w-8 items-center justify-center border border-line text-navy transition-colors hover:border-navy/40"
          >
            <X size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 border border-line/80 bg-pale">
          {preview ? (
            <img
              src={preview}
              alt=""
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center">
              <span className="label text-[9px]">{t.memories.noPhoto}</span>
            </div>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setPhoto(file);
            setError(null);
          }}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="mt-3 inline-flex items-center gap-2 border border-line px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-navy/75 transition-colors hover:border-navy/40 hover:text-ink"
        >
          <Upload size={12} strokeWidth={1.5} aria-hidden="true" />
          {preview ? t.memories.changePhoto : t.memories.addPhoto}
        </button>
        <p className="label mt-2 text-[9px]">{t.memories.photoHint}</p>

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
              className={`${fieldClass} mt-2 block max-w-[220px] font-mono text-[12px]`}
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

        {error && (
          <p role="alert" className="mt-4 text-[11px] text-ember">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy || !title.trim() || !date}
            className="inline-flex items-center gap-2 border border-navy/70 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-navy transition-colors hover:bg-navy hover:text-mist disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Loader2 size={12} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
            {busy ? t.memories.saving : t.memories.save}
          </button>
          <button type="button" onClick={onClose} className="btn-quiet">
            {t.memories.cancel}
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              className={`btn-quiet ml-auto hover:text-ember ${confirming ? "text-ember" : ""}`}
            >
              <Trash2 size={12} strokeWidth={1.5} aria-hidden="true" />
              {confirming ? t.memories.confirmDelete : t.memories.delete}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

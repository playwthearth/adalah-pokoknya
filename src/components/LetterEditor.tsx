import { Camera, Loader2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { LetterDraft } from "../hooks/useLetters";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useLanguage } from "../hooks/useLanguage";
import { useSettings } from "../hooks/useSettings";
import type { Letter, LetterCategory } from "../types";
import { zonedDateKey } from "../utils/format";
import { compressImage, MAX_IMAGE_BYTES } from "../utils/image";

const MAX_BODY = 4000;
const CATEGORIES: LetterCategory[] = [
  "love",
  "birthday",
  "encouragement",
  "thoughts",
  "special",
];

const fieldClass =
  "w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-ink outline-none transition-colors placeholder:text-muted-strong focus:border-navy sm:text-sm";

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border px-4 text-[10px] uppercase tracking-[0.18em] transition-colors";

const photoActionClass = `${actionClass} w-full border-line text-navy/75 hover:border-navy/40 hover:text-ink disabled:opacity-60 sm:w-auto`;

interface LetterEditorProps {
  /** The letter being changed, or null for a new one. */
  letter?: Letter | null;
  onClose: () => void;
  onSave: (draft: LetterDraft) => Promise<void>;
}

export function LetterEditor({ letter, onClose, onSave }: LetterEditorProps) {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const editing = Boolean(letter);
  const [title, setTitle] = useState(letter?.title.en ?? "");
  const [category, setCategory] = useState<LetterCategory>(letter?.category ?? "love");
  const [date, setDate] = useState(
    () => letter?.date ?? zonedDateKey(new Date(), settings.timezone),
  );
  const [body, setBody] = useState(letter?.content.en ?? "");
  const [photo, setPhoto] = useState<File | null>(null);
  /** True when a photo the letter already had should be taken away. */
  const [removeExisting, setRemoveExisting] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The device or drive picker. */
  const fileInput = useRef<HTMLInputElement>(null);
  /** The camera, where the browser supports it; elsewhere this is the same picker. */
  const cameraInput = useRef<HTMLInputElement>(null);

  const sheetRef = useFocusTrap<HTMLDivElement>(true, () => {
    if (!busy) onClose();
  });

  const pickedUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  const existingUrl = removeExisting ? null : (letter?.image ?? null);
  const preview = pickedUrl ?? existingUrl;

  useEffect(() => {
    if (!pickedUrl) return;
    const url = pickedUrl;
    return () => URL.revokeObjectURL(url);
  }, [pickedUrl]);

  // The sheet covers the page, so the archive behind it must not scroll.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const choosePhoto = async (file: File | null) => {
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
      setPhotoError(t.letters.photoError);
      return;
    }
    setPreparing(true);
    try {
      setPhoto(await compressImage(file));
      setRemoveExisting(false);
    } finally {
      setPreparing(false);
    }
  };

  const clearPhoto = () => {
    setPhotoError(null);
    if (photo) setPhoto(null);
    else setRemoveExisting(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || preparing || !title.trim() || !body.trim() || !date) return;
    setBusy(true);
    setError(null);
    try {
      await onSave({
        title,
        body,
        category,
        date,
        language,
        photo,
        removePhoto: removeExisting && !photo,
      });
      onClose();
    } catch (failure) {
      console.error("[letters] save failed", failure);
      setError(t.letters.saveError);
    } finally {
      setBusy(false);
    }
  };

  // Portalled to <body>: the page transition leaves a CSS filter on an
  // ancestor, which would otherwise pin this sheet to the document.
  return createPortal(
    <div
      ref={sheetRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={editing ? t.letters.editTitle : t.letters.addTitle}
      className="fixed inset-0 z-[88] overflow-y-auto overscroll-contain bg-scrim/60 outline-none sm:flex sm:items-start sm:justify-center sm:p-8 sm:backdrop-blur-sm"
    >
      <form
        onSubmit={submit}
        className="flex min-h-[100dvh] w-full flex-col bg-mist sm:min-h-0 sm:max-w-xl sm:border sm:border-line sm:shadow-[0_30px_80px_-40px_rgba(34,58,79,0.5)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line/70 px-5 py-4 sm:border-0 sm:p-8 sm:pb-0">
          <p className="label pt-2">{editing ? t.letters.editTitle : t.letters.addTitle}</p>
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
          <p className="label text-[9px] normal-case tracking-[0.08em]">
            {editing ? t.letters.editHint : t.letters.addHint}
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label htmlFor="letter-title" className="label block">
                {t.letters.titleLabel}
              </label>
              <input
                id="letter-title"
                type="text"
                required
                maxLength={120}
                autoComplete="off"
                value={title}
                placeholder={t.letters.titlePlaceholder}
                onChange={(event) => setTitle(event.target.value)}
                className={`${fieldClass} mt-2`}
              />
            </div>

            <div>
              <span className="label block">{t.letters.categoryLabel}</span>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t.letters.categoryLabel}>
                {CATEGORIES.map((option) => {
                  const active = category === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCategory(option)}
                      aria-pressed={active}
                      className={`inline-flex min-h-11 items-center rounded-full border px-3.5 py-1.5 text-[9px] uppercase tracking-[0.16em] transition-colors ${
                        active
                          ? "border-navy bg-navy text-mist"
                          : "border-line/80 text-navy/70 hover:border-plum/40 hover:text-ink"
                      }`}
                    >
                      {t.letters.categories[option]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="letter-date" className="label block">
                {t.letters.dateLabel}
              </label>
              <input
                id="letter-date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={`${fieldClass} mt-2 min-w-0 font-mono text-base sm:max-w-[220px] sm:text-[12px]`}
              />
            </div>

            <div>
              <span className="label block">{t.letters.photoLabel}</span>
              <div className="mt-2 border border-line/80 bg-pale">
                {preview ? (
                  <img
                    src={preview}
                    alt=""
                    decoding="async"
                    className="mx-auto block max-h-[min(40vh,320px)] w-auto max-w-full"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center">
                    <span className="label text-[9px]">{t.letters.choosePhoto}</span>
                  </div>
                )}
              </div>

              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  void choosePhoto(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
              <input
                ref={cameraInput}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(event) => {
                  void choosePhoto(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={preparing}
                  className={photoActionClass}
                >
                  <Upload size={13} strokeWidth={1.5} aria-hidden="true" />
                  {preview ? t.letters.changePhoto : t.letters.choosePhoto}
                </button>
                <button
                  type="button"
                  onClick={() => cameraInput.current?.click()}
                  disabled={preparing}
                  className={photoActionClass}
                >
                  <Camera size={13} strokeWidth={1.5} aria-hidden="true" />
                  {t.letters.takePhoto}
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    disabled={preparing}
                    className={`${photoActionClass} border-transparent text-muted-strong hover:text-ember`}
                  >
                    <X size={13} strokeWidth={1.5} aria-hidden="true" />
                    {t.letters.removePhoto}
                  </button>
                )}
              </div>

              <p
                aria-live="polite"
                className={`label mt-2 text-[9px] normal-case tracking-[0.08em] ${
                  photoError ? "text-ember" : ""
                }`}
              >
                {photoError ??
                  (preparing ? t.letters.preparingPhoto : t.letters.photoHint)}
              </p>
            </div>

            <div>
              <label htmlFor="letter-body" className="label block">
                {t.letters.bodyLabel}
              </label>
              <textarea
                id="letter-body"
                required
                rows={9}
                maxLength={MAX_BODY}
                value={body}
                placeholder={t.letters.bodyPlaceholder}
                aria-describedby="letter-body-hint"
                onChange={(event) => setBody(event.target.value)}
                className={`${fieldClass} mt-2 resize-y leading-relaxed`}
              />
              <p
                id="letter-body-hint"
                className="label mt-2 text-[9px] normal-case tracking-[0.08em]"
              >
                {t.letters.bodyHint} · {t.letters.remaining(MAX_BODY - body.length)}
              </p>
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
            disabled={busy || preparing || !title.trim() || !body.trim() || !date}
            className={`${actionClass} flex-1 border-navy/70 font-mono text-navy hover:bg-navy hover:text-mist disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none`}
          >
            {(busy || preparing) && (
              <Loader2 size={12} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
            )}
            {preparing
              ? t.letters.preparingPhoto
              : busy
                ? editing
                  ? t.letters.savingChanges
                  : t.letters.saving
                : editing
                  ? t.letters.saveChanges
                  : t.letters.save}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`${actionClass} border-line text-navy/70 hover:border-navy/40 hover:text-ink`}
          >
            {t.letters.cancel}
          </button>
          <p className="label ml-auto hidden text-[9px] normal-case tracking-[0.08em] sm:block">
            {t.letters.languageHint}
          </p>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

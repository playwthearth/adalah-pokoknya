import { Loader2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { LetterDraft } from "../hooks/useLetters";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useLanguage } from "../hooks/useLanguage";
import { useSettings } from "../hooks/useSettings";
import type { LetterCategory } from "../types";
import { zonedDateKey } from "../utils/format";

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

interface LetterEditorProps {
  onClose: () => void;
  onSave: (draft: LetterDraft) => Promise<void>;
}

export function LetterEditor({ onClose, onSave }: LetterEditorProps) {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<LetterCategory>("love");
  const [date, setDate] = useState(() => zonedDateKey(new Date(), settings.timezone));
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sheetRef = useFocusTrap<HTMLDivElement>(true, () => {
    if (!busy) onClose();
  });

  // The sheet covers the page, so the archive behind it must not scroll.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !title.trim() || !body.trim() || !date) return;
    setBusy(true);
    setError(null);
    try {
      await onSave({ title, body, category, date, language });
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
      aria-label={t.letters.addTitle}
      className="fixed inset-0 z-[88] overflow-y-auto overscroll-contain bg-scrim/60 outline-none sm:flex sm:items-start sm:justify-center sm:p-8 sm:backdrop-blur-sm"
    >
      <form
        onSubmit={submit}
        className="flex min-h-[100dvh] w-full flex-col bg-mist sm:min-h-0 sm:max-w-xl sm:border sm:border-line sm:shadow-[0_30px_80px_-40px_rgba(34,58,79,0.5)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line/70 px-5 py-4 sm:border-0 sm:p-8 sm:pb-0">
          <p className="label pt-2">{t.letters.addTitle}</p>
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
          <p className="label text-[9px] normal-case tracking-[0.08em]">{t.letters.addHint}</p>

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
                {t.letters.bodyHint} · {t.notes.remaining(MAX_BODY - body.length)}
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
            disabled={busy || !title.trim() || !body.trim() || !date}
            className={`${actionClass} flex-1 border-navy/70 font-mono text-navy hover:bg-navy hover:text-mist disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none`}
          >
            {busy && (
              <Loader2 size={12} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
            )}
            {busy ? t.letters.saving : t.letters.save}
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

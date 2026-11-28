import { motion, useReducedMotion } from "framer-motion";
import { Bookmark, ChevronLeft, ChevronRight, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type UIEvent } from "react";
import { createPortal } from "react-dom";
import { dictionaries } from "../i18n";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useLanguage } from "../hooks/useLanguage";
import type { Letter } from "../types";
import { formatDate } from "../utils/format";
import { DecorCollage, StampMark } from "./LetterDecor";

interface LetterReaderProps {
  letter: Letter;
  /** Place in the list being read, for "letter 3 of 12". */
  position: { index: number; total: number };
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  /** True when the reader wrote this letter, so they may change or remove it. */
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

/**
 * The reading view: a sheet of paper rather than a dialog. The page scrolls
 * inside the sheet, a hairline at the top measures how far in the reader is,
 * and the arrows move through the collection without closing it.
 *
 * The component is keyed by letter id where it is used, so opening another
 * letter starts at the top with a fresh page.
 */
export function LetterReader({
  letter,
  position,
  onClose,
  onPrevious,
  onNext,
  isFavorite,
  onToggleFavorite,
  canManage,
  onEdit,
  onDelete,
}: LetterReaderProps) {
  const { t, language, locale } = useLanguage();
  const reduceMotion = useReducedMotion();
  const panelRef = useFocusTrap<HTMLDivElement>(true, onClose);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const stamps = (letter.decor ?? []).filter((item) => item.kind === "stamp");
  const collage = (letter.decor ?? []).filter((item) => item.kind !== "stamp");
  const paragraphs = letter.content[language].split(/\n{2,}/);
  const writtenIn = letter.language && letter.language !== language;

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Left and right move through the collection; typing in a field is left alone.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowLeft" && onPrevious) {
        event.preventDefault();
        onPrevious();
      } else if (event.key === "ArrowRight" && onNext) {
        event.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onPrevious, onNext]);

  const trackProgress = (event: UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    const scrollable = node.scrollHeight - node.clientHeight;
    const next = scrollable > 8 ? Math.min(1, Math.max(0, node.scrollTop / scrollable)) : 1;
    setProgress(next);
  };

  const remove = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleteError(false);
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (failure) {
      console.error("[letters] delete failed", failure);
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  const percent = Math.round(progress * 100);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] flex items-stretch justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute inset-0 bg-scrim/55 backdrop-blur-[3px]" onClick={onClose} aria-hidden="true" />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="letter-reader-title"
        tabIndex={-1}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-[100dvh] w-full flex-col border-line bg-mist outline-none sm:h-auto sm:max-h-[92dvh] sm:max-w-3xl sm:border sm:shadow-[0_40px_120px_-50px_rgba(8,16,24,0.6)]"
      >
        <div
          role="progressbar"
          aria-label={t.letters.readingProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="relative h-[3px] w-full shrink-0 bg-line/40"
        >
          <span
            className="block h-full origin-left bg-plum transition-transform duration-150 ease-out"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={t.common.close}
          className="absolute right-3 top-4 z-20 inline-flex h-11 w-11 items-center justify-center border border-line/70 bg-mist/95 text-muted-strong transition-colors hover:border-navy/30 hover:text-ink"
        >
          <X size={15} strokeWidth={1.5} aria-hidden="true" />
        </button>

        <div
          ref={scrollRef}
          onScroll={trackProgress}
          className="relative flex-1 overflow-y-auto overscroll-contain"
        >
          <article className="relative px-6 pb-12 pt-14 sm:px-12 sm:pb-16 sm:pt-16">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-periwinkle/50 via-line to-transparent"
            />

            <div className="flex flex-wrap items-start justify-between gap-4 pr-10">
              <div>
                <span className="label flex items-center gap-2">
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ember/80" />
                  {t.letters.categories[letter.category]}
                </span>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-strong">
                  {formatDate(letter.date, locale)}
                </p>
                {writtenIn && letter.language && (
                  <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-plum/80">
                    {t.letters.writtenIn(dictionaries[letter.language].languageName)}
                  </p>
                )}
              </div>

              {stamps.length > 0 && (
                <div aria-hidden="true" className="hidden items-start sm:flex">
                  {stamps.slice(0, 2).map((stamp, index) => (
                    <StampMark
                      key={`${stamp.value}-${index}`}
                      id={stamp.value}
                      className={index === 0 ? "-rotate-3" : "-ml-4 rotate-3"}
                    />
                  ))}
                </div>
              )}
            </div>

            <h2
              id="letter-reader-title"
              className="mt-6 font-display text-[clamp(1.9rem,4.4vw,2.6rem)] leading-[1.1] text-ink"
            >
              {letter.title[language]}
            </h2>

            {collage.length > 0 && <DecorCollage items={collage} className="mt-6" />}

            {letter.image && (
              <figure className="mt-7 max-w-md">
                <span className="polaroid block">
                  <img
                    src={letter.image}
                    alt={t.letters.photoAlt}
                    loading="lazy"
                    decoding="async"
                    className="block max-h-[52vh] w-full object-cover"
                  />
                </span>
              </figure>
            )}

            <div className="mt-7 space-y-4">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className={`letter-body text-[1.1rem] leading-[1.95] text-navy/90 [text-wrap:pretty] ${
                    index === 0
                      ? "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[3.1rem] first-letter:leading-[0.82] first-letter:text-plum"
                      : ""
                  }`}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <span
              aria-hidden="true"
              className="mt-9 block h-px w-16 bg-gradient-to-r from-periwinkle to-transparent"
            />

            <div className="mt-6 flex items-center justify-end gap-3">
              <p className="label">{t.letters.from}</p>
              <span className="font-serif text-[15px] italic tracking-[0.06em] text-plum">
                {t.letters.signoff}
              </span>
            </div>

            <p className="caption mt-4 text-[13px] text-muted-strong">
              {t.letters.position(position.index, position.total)}
            </p>

            {canManage && (
              <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-line/70 pt-5">
                <button
                  type="button"
                  onClick={onEdit}
                  className="btn-quiet inline-flex min-h-11 items-center gap-2 px-3 text-[9px] uppercase tracking-[0.14em]"
                >
                  <Pencil size={11} strokeWidth={1.5} aria-hidden="true" />
                  {t.letters.edit}
                </button>
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={deleting}
                  className={`btn-quiet inline-flex min-h-11 items-center gap-2 px-3 text-[9px] uppercase tracking-[0.14em] disabled:opacity-60 ${
                    confirmDelete ? "text-ember" : ""
                  }`}
                >
                  <Trash2 size={11} strokeWidth={1.5} aria-hidden="true" />
                  {confirmDelete ? t.letters.confirmDelete : t.letters.delete}
                </button>
              </div>
            )}

            {deleteError && (
              <p role="alert" className="mt-3 text-right text-[11px] text-ember">
                {t.letters.deleteError}
              </p>
            )}
          </article>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-line/70 bg-mist/95 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6">
          <button
            type="button"
            onClick={onPrevious}
            disabled={!onPrevious}
            aria-label={t.letters.previousLetter}
            className="inline-flex min-h-11 items-center gap-1.5 px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-navy/70 transition-colors hover:text-ink disabled:opacity-30 sm:px-3"
          >
            <ChevronLeft size={14} strokeWidth={1.5} aria-hidden="true" />
            <span className="hidden sm:inline">{t.common.previous}</span>
          </button>

          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? t.letters.unfavorite : t.letters.favorite}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
              isFavorite
                ? "border-plum/50 text-plum"
                : "border-line/70 text-navy/60 hover:border-plum/40 hover:text-plum"
            }`}
          >
            <Bookmark
              size={13}
              strokeWidth={1.5}
              aria-hidden="true"
              fill={isFavorite ? "currentColor" : "none"}
            />
            <span className="hidden sm:inline">
              {isFavorite ? t.letters.unfavorite : t.letters.favorite}
            </span>
          </button>

          <span className="hidden font-mono text-[9px] tabular-nums uppercase tracking-[0.16em] text-muted-strong md:inline">
            {t.letters.position(position.index, position.total)}
          </span>

          <button
            type="button"
            onClick={onNext}
            disabled={!onNext}
            aria-label={t.letters.nextLetter}
            className="inline-flex min-h-11 items-center gap-1.5 px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-navy/70 transition-colors hover:text-ink disabled:opacity-30 sm:px-3"
          >
            <span className="hidden sm:inline">{t.common.next}</span>
            <ChevronRight size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </footer>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

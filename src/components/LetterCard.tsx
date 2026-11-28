import { ArrowUpRight, Bookmark } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { useMediaQuery } from "../hooks/useMediaQuery";
import type { Letter } from "../types";
import { formatDate } from "../utils/format";
import { DecorCollage } from "./LetterDecor";

interface LetterCardProps {
  letter: Letter;
  /** Its place in the whole collection, counted from one. */
  number: number;
  onOpen: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

/**
 * A letter as it sits in the archive: a numbered sheet with the date in the
 * margin, a short excerpt, and whatever it carries pinned to the corner.
 *
 * The whole sheet opens the letter through one stretched button, so the card
 * stays a single tab stop; the bookmark is a separate button above it.
 */
export function LetterCard({
  letter,
  number,
  onOpen,
  isFavorite,
  onToggleFavorite,
}: LetterCardProps) {
  const { t, language, locale } = useLanguage();
  const body = letter.content[language];
  const preview = body.replace(/\s+/g, " ").trim();
  const excerpt = preview.length > 170 ? `${preview.slice(0, 170)}…` : preview;
  const decor = letter.decor ?? [];
  const title = letter.title[language];
  // The decoration sits in the margin rail on a wide card and in the reading
  // row on a narrow one; one picture, moved, rather than two drawn and hidden.
  const wide = useMediaQuery("(min-width: 640px)");

  return (
    <article className="hover-lift group relative overflow-hidden border border-line/70 bg-surface transition-colors duration-500 hover:border-navy/25 hover:bg-mist focus-within:border-navy/30">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${t.letters.read}: ${title}`}
        className="absolute inset-0 z-0 cursor-pointer outline-none"
      />

      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-periwinkle via-line/60 to-transparent"
      />

      <div className="pointer-events-none relative flex flex-col gap-5 p-6 sm:flex-row sm:gap-8 sm:p-8">
        <div className="flex items-baseline justify-between gap-3 sm:w-14 sm:flex-col sm:items-start sm:justify-start sm:border-r sm:border-line/60 sm:pr-4">
          <span className="font-hand text-[26px] leading-none text-periwinkle">
            {String(number).padStart(2, "0")}
          </span>
          <span className="label text-[8px] sm:mt-3">{t.letters.categories[letter.category]}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-strong">
              {formatDate(letter.date, locale)}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-line/60" />
          </div>

          <h3 className="mt-2.5 pr-9 font-display text-2xl leading-tight text-ink transition-colors duration-300 group-hover:text-plum sm:text-[1.7rem]">
            {title}
          </h3>

          <p className="letter-body mt-2.5 line-clamp-3 text-[1.05rem] leading-[1.85] text-navy/80">
            {excerpt}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/70 transition-colors group-hover:text-plum">
              {t.letters.read}
              <ArrowUpRight
                size={12}
                strokeWidth={1.5}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </span>

            {decor.length > 0 && !wide && (
              <DecorCollage items={decor.slice(0, 3)} compact className="justify-end" />
            )}
          </div>
        </div>

        {wide && (letter.image || decor.length > 0) && (
          <div className="flex w-28 shrink-0 flex-col items-end gap-3">
            {letter.image && (
              <img
                src={letter.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-[4/5] w-full border border-line/60 object-cover"
              />
            )}
            {decor.length > 0 && (
              <DecorCollage items={decor.slice(0, 3)} compact className="justify-end" />
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleFavorite}
        aria-pressed={isFavorite}
        aria-label={`${isFavorite ? t.letters.unfavorite : t.letters.favorite}: ${title}`}
        className={`pointer-events-auto absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border bg-mist/85 transition-colors ${
          isFavorite
            ? "border-plum/50 text-plum"
            : "border-line/60 text-navy/45 hover:border-plum/40 hover:text-plum"
        }`}
      >
        <Bookmark
          size={15}
          strokeWidth={1.5}
          aria-hidden="true"
          fill={isFavorite ? "currentColor" : "none"}
        />
      </button>
    </article>
  );
}

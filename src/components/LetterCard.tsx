import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import type { Letter } from "../types";
import { formatDate } from "../utils/format";
import { DecorCollage } from "./LetterDecor";

interface LetterCardProps {
  letter: Letter;
  index: number;
  onOpen: () => void;
}

export function LetterCard({ letter, index, onOpen }: LetterCardProps) {
  const { t, language, locale } = useLanguage();
  const body = letter.content[language];
  const preview = body.replace(/\s+/g, " ").trim();
  const excerpt = preview.length > 170 ? `${preview.slice(0, 170)}…` : preview;
  const decor = letter.decor ?? [];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="hover-lift group relative block w-full overflow-hidden border border-line/70 bg-surface text-left transition-colors duration-500 hover:border-navy/25 hover:bg-mist"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-periwinkle via-line/60 to-transparent"
      />

      <span className="flex flex-col gap-5 p-6 sm:flex-row sm:gap-8 sm:p-8">
        <span className="flex items-baseline justify-between gap-3 sm:w-14 sm:flex-col sm:items-start sm:justify-start sm:border-r sm:border-line/60 sm:pr-4">
          <span className="font-hand text-[26px] leading-none text-periwinkle">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="label text-[8px] sm:mt-3">{t.letters.categories[letter.category]}</span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-strong">
              {formatDate(letter.date, locale)}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-line/60" />
          </span>

          <span className="mt-2.5 block font-display text-2xl leading-tight text-ink transition-colors duration-300 group-hover:text-plum sm:text-[1.7rem]">
            {letter.title[language]}
          </span>

          <span className="letter-body mt-2.5 line-clamp-3 block text-[1.05rem] leading-[1.85] text-navy/80">
            {excerpt}
          </span>

          <span className="mt-4 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/70 transition-colors group-hover:text-plum">
              {t.letters.read}
              <ArrowUpRight
                size={12}
                strokeWidth={1.5}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </span>

            {decor.length > 0 && (
              <DecorCollage items={decor.slice(0, 3)} compact className="justify-end sm:hidden" />
            )}
          </span>
        </span>

        {(letter.image || decor.length > 0) && (
          <span className="hidden w-28 shrink-0 flex-col items-end gap-3 sm:flex">
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
          </span>
        )}
      </span>
    </button>
  );
}

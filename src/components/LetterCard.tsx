import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import type { Letter } from "../types";
import { formatDate } from "../utils/format";

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

  return (
    <button
      type="button"
      onClick={onOpen}
      className="hover-lift group relative block w-full overflow-hidden rounded-[6px] border border-line/80 bg-surface p-6 text-left sm:p-8"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-periwinkle/80 to-transparent"
      />
      <span
        aria-hidden="true"
        className="absolute right-5 top-3 font-hand text-[22px] leading-none text-periwinkle"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="flex items-start gap-5 sm:gap-7">
        <div className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pr-8">
            <span className="label text-[9px]">{t.letters.categories[letter.category]}</span>
            <span aria-hidden="true" className="h-px w-4 bg-line" />
            <span className="font-mono text-[10px] tracking-[0.14em] text-muted-strong">
              {formatDate(letter.date, locale)}
            </span>
          </span>

          <span className="mt-3 block font-display text-2xl leading-tight text-ink transition-colors duration-300 group-hover:text-plum sm:text-[1.75rem]">
            {letter.title[language]}
          </span>

          <span className="letter-body mt-3 line-clamp-3 block text-[1.05rem] leading-[1.85] text-navy/80">
            {excerpt}
          </span>

          <span className="mt-5 flex items-center gap-3">
            <span aria-hidden="true" className="h-px flex-1 bg-line/80" />
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-navy/70 transition-colors group-hover:text-plum">
              {t.letters.read}
              <ArrowUpRight
                size={12}
                strokeWidth={1.5}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </span>
          </span>
        </div>

        {letter.image && (
          <span aria-hidden="true" className="hidden w-24 shrink-0 sm:block lg:w-32">
            <img
              src={letter.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full border border-line/60 object-cover"
            />
          </span>
        )}
      </div>
    </button>
  );
}

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
  const excerpt = preview.length > 150 ? `${preview.slice(0, 150)}…` : preview;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative grid w-full grid-cols-[auto_minmax(0,1fr)] gap-x-4 overflow-hidden border-t border-line/70 py-6 text-left transition-colors hover:bg-surface/50 sm:gap-x-8 sm:py-8"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-px scale-y-0 bg-ember/70 transition-transform duration-500 ease-out group-hover:scale-y-100"
      />
      <span className="label pt-1.5 text-[9px] tracking-[0.18em] transition-colors group-hover:text-ember">
        {String(index + 1).padStart(2, "0")}
      </span>

      <span className="min-w-0">
        <span className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <span className="font-display text-xl font-light text-ink transition-colors group-hover:text-navy sm:text-2xl">
            {letter.title[language]}
          </span>
          <span className="label flex shrink-0 items-center gap-2 text-[9px]">
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ember/70" />
            {t.letters.categories[letter.category]}
          </span>
        </span>

        <span className="mt-2.5 block max-w-2xl text-[13px] leading-relaxed text-muted-strong">
          {excerpt}
        </span>

        <span className="mt-4 flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-strong">
            {formatDate(letter.date, locale)}
          </span>
          <span className="h-px flex-1 bg-line/70" aria-hidden="true" />
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-navy/70 transition-colors group-hover:text-ink">
            {t.letters.read}
            <ArrowUpRight
              size={12}
              strokeWidth={1.5}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
        </span>
      </span>
    </button>
  );
}

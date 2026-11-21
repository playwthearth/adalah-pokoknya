import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import type { Memory } from "../types";
import { formatDate } from "../utils/format";

interface MemoryCardProps {
  memory: Memory;
  index: number;
  onOpen: () => void;
}

export function MemoryCard({ memory, index, onOpen }: MemoryCardProps) {
  const { t, language, locale } = useLanguage();
  const flipped = index % 2 === 1;

  return (
    <article className="relative md:grid md:grid-cols-2 md:items-center md:gap-12">
      {/* Timeline node */}
      <span
        aria-hidden="true"
        className="absolute left-[7px] top-2 hidden h-2 w-2 -translate-x-1/2 rounded-full border border-cyan bg-mist md:left-1/2 md:top-1/2 md:block"
      >
        <span className="absolute inset-[3px] rounded-full bg-ember/70" />
      </span>

      <div className={flipped ? "md:order-2" : "md:order-1"}>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${t.memories.view}: ${memory.title[language]}`}
          className="group relative block w-full overflow-hidden border border-line/80 bg-pale"
        >
          <img
            src={memory.image}
            alt={memory.title[language]}
            width={1184}
            height={880}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-navy/0 transition-colors duration-500 group-hover:bg-navy/10"
          />
          <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center border border-mist/60 bg-mist/20 text-mist opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
            <ArrowUpRight size={14} strokeWidth={1.5} />
          </span>
          <span className="label absolute left-3 top-3 bg-mist/85 px-2 py-1 text-[8px] text-navy">
            {String(index + 1).padStart(2, "0")}
          </span>
        </button>
      </div>

      <div className={`mt-5 md:mt-0 ${flipped ? "md:order-1 md:text-right" : "md:order-2"}`}>
        <p className="label">{formatDate(memory.date, locale)}</p>
        <h2 className="mt-3 font-display text-2xl font-light text-ink sm:text-3xl">
          {memory.title[language]}
        </h2>
        <p className="mt-3 max-w-md text-[13px] leading-relaxed text-muted md:inline-block">
          {memory.description[language]}
        </p>
        <div className={`mt-4 ${flipped ? "md:justify-end" : ""} flex`}>
          <button type="button" onClick={onOpen} className="btn-quiet group">
            {t.memories.view}
            <ArrowUpRight
              size={12}
              strokeWidth={1.5}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </div>
    </article>
  );
}

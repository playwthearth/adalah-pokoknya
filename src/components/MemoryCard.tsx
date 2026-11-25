import { ArrowUpRight, Image as ImageIcon, Pencil } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import type { Memory } from "../types";
import { formatDate } from "../utils/format";

interface MemoryCardProps {
  memory: Memory;
  index: number;
  onOpen: () => void;
  onEdit: () => void;
}

export function MemoryCard({ memory, index, onOpen, onEdit }: MemoryCardProps) {
  const { t, locale } = useLanguage();
  const flipped = index % 2 === 1;

  return (
    <article className="group/card relative md:grid md:grid-cols-2 md:items-center md:gap-12">
      {/* Timeline node */}
      <span
        aria-hidden="true"
        className="absolute left-[7px] top-2 h-2 w-2 -translate-x-1/2 rounded-full border border-cyan bg-mist md:left-1/2 md:top-1/2"
      >
        <span className="absolute inset-[3px] rounded-full bg-ember/70" />
      </span>

      <div className={flipped ? "md:order-2" : "md:order-1"}>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${t.memories.view}: ${memory.title}`}
          className="group relative block w-full overflow-hidden border border-line/80 bg-pale"
        >
          {memory.image ? (
            <img
              src={memory.image}
              alt={memory.title}
              width={1184}
              height={880}
              loading="lazy"
              decoding="async"
              className="block h-auto w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 text-muted-strong">
              <ImageIcon size={22} strokeWidth={1.2} aria-hidden="true" />
              <span className="label text-[9px]">{t.memories.noPhoto}</span>
            </span>
          )}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-scrim/45 via-scrim/5 to-transparent opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
          />
          <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center border border-white/60 bg-white/20 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:backdrop-blur-sm">
            <ArrowUpRight size={14} strokeWidth={1.5} />
          </span>
          {/* Viewfinder ticks over the photograph. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-2">
            <span className="absolute left-0 top-0 h-3 w-3 border-l border-t border-mist/70" />
            <span className="absolute right-0 top-0 h-3 w-3 border-r border-t border-mist/70" />
            <span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-mist/70" />
            <span className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-mist/70" />
          </span>
          <span className="label absolute left-3 top-3 bg-mist/85 px-2 py-1 text-[8px] text-navy transition-colors duration-500 group-hover:bg-mist group-hover:text-ember">
            {String(index + 1).padStart(2, "0")}
          </span>
        </button>
      </div>

      <div className={`mt-5 md:mt-0 ${flipped ? "md:order-1 md:text-right" : "md:order-2"}`}>
        <p className="label flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-px w-4 bg-ember/70 transition-all duration-500 group-hover/card:w-8"
          />
          {formatDate(memory.date, locale)}
        </p>
        <h2 className="mt-3 font-display text-2xl font-light text-ink sm:text-3xl">
          {memory.title}
        </h2>
        {memory.note && (
          <p className="mt-3 max-w-md whitespace-pre-wrap text-[13px] leading-relaxed text-muted-strong md:inline-block">
            {memory.note}
          </p>
        )}
        <div className={`mt-3 ${flipped ? "md:justify-end" : ""} flex flex-wrap items-center gap-x-6 gap-y-1`}>
          <button type="button" onClick={onOpen} className="btn-quiet group min-h-11">
            {t.memories.view}
            <ArrowUpRight
              size={12}
              strokeWidth={1.5}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </button>
          <button type="button" onClick={onEdit} className="btn-quiet group min-h-11">
            <Pencil size={11} strokeWidth={1.5} aria-hidden="true" />
            {t.memories.edit}
          </button>
        </div>
      </div>
    </article>
  );
}

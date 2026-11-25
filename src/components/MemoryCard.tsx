import { ArrowUpRight, Image as ImageIcon, Pencil } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import type { Memory } from "../types";
import { formatDate } from "../utils/format";
import { Blossom } from "./Marks";

interface MemoryCardProps {
  memory: Memory;
  index: number;
  onOpen: () => void;
  onEdit: () => void;
}

export function MemoryCard({ memory, index, onOpen, onEdit }: MemoryCardProps) {
  const { t, locale } = useLanguage();
  const flipped = index % 2 === 1;
  // Every third plate is square, the rest alternate portrait and landscape, so
  // the timeline reads like a scrapbook rather than a grid.
  const shape = index % 3 === 1 ? "aspect-[4/3]" : index % 3 === 2 ? "aspect-square" : "aspect-[4/5]";

  return (
    <article className="group/card relative md:grid md:grid-cols-2 md:items-center md:gap-14">
      {/* Timeline blossom */}
      <span
        aria-hidden="true"
        className="absolute left-[7px] top-4 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-mist md:left-1/2 md:top-1/2"
      >
        <Blossom className="h-4 w-4 text-periwinkle" />
      </span>

      <div className={flipped ? "md:order-2" : "md:order-1"}>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${t.memories.view}: ${memory.title}`}
          className={`polaroid group relative mx-auto block w-full max-w-[430px] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:rotate-0 ${
            flipped ? "rotate-[1.2deg]" : "-rotate-[1.2deg]"
          }`}
        >
          <span
            aria-hidden="true"
            className={`tape -top-3 ${flipped ? "right-7 rotate-[3deg]" : "left-7 -rotate-[3deg]"}`}
          />
          {memory.image ? (
            <img
              src={memory.image}
              alt={memory.title}
              width={1184}
              height={880}
              loading="lazy"
              decoding="async"
              className={`block w-full object-cover ${shape}`}
            />
          ) : (
            <span
              className={`flex w-full flex-col items-center justify-center gap-3 bg-lavender/40 text-muted-strong ${shape}`}
            >
              <ImageIcon size={22} strokeWidth={1.2} aria-hidden="true" />
              <span className="label text-[9px]">{t.memories.noPhoto}</span>
            </span>
          )}

          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-3 bottom-2.5 flex items-baseline justify-between gap-3"
          >
            <span className="caption truncate text-[15px]">{memory.title}</span>
            <span className="label shrink-0 text-[8px]">
              {String(index + 1).padStart(2, "0")}
            </span>
          </span>
        </button>
      </div>

      <div className={`mt-6 md:mt-0 ${flipped ? "md:order-1 md:text-right" : "md:order-2"}`}>
        <p className="caption text-[16px] text-plum">{formatDate(memory.date, locale)}</p>
        <h2 className="mt-1.5 font-display text-2xl leading-tight text-ink sm:text-[1.85rem]">
          {memory.title}
        </h2>
        {memory.note && (
          <p className="letter-body mt-3 max-w-md whitespace-pre-wrap text-[1.05rem] leading-[1.85] text-navy/80 md:inline-block">
            {memory.note}
          </p>
        )}
        <div
          className={`mt-4 ${flipped ? "md:justify-end" : ""} flex flex-wrap items-center gap-x-6 gap-y-1`}
        >
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

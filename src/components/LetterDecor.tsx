import { findStamp, findSticker, type StampTone } from "../data/letterDecor";
import type { LetterDecor } from "../types";

const TONES: Record<StampTone, string> = {
  navy: "border-navy/45 text-navy bg-mist",
  plum: "border-plum/45 text-plum bg-lavender/30",
  cyan: "border-cyan/60 text-navy bg-pale",
  ember: "border-ember/45 text-ember bg-surface",
};

/** A postage stamp cut from type: perforated edge, country line, denomination. */
export function StampMark({
  id,
  compact = false,
  className = "",
}: {
  id: string;
  compact?: boolean;
  className?: string;
}) {
  const stamp = findStamp(id);
  if (!stamp) return null;

  return (
    <span
      className={`inline-flex select-none flex-col items-center justify-center border-2 border-dashed ${
        TONES[stamp.tone]
      } ${compact ? "px-2 py-1" : "px-3.5 py-2.5"} ${className}`}
    >
      <span
        className={`font-mono uppercase tracking-[0.26em] ${
          compact ? "text-[6px]" : "text-[7px]"
        }`}
      >
        {stamp.top}
      </span>
      <span
        className={`mt-0.5 font-display leading-none ${
          compact ? "text-[10px]" : "text-[15px]"
        }`}
      >
        {stamp.label}
      </span>
      <span className={`mt-1 font-serif tracking-[0.18em] ${compact ? "text-[7px]" : "text-[9px]"}`}>
        {stamp.bottom}
      </span>
    </span>
  );
}

function GifPrint({ src, compact }: { src: string; compact: boolean }) {
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={
        compact
          ? "h-10 w-auto max-w-[64px] border border-line/60 bg-mist object-cover"
          : "h-20 w-auto max-w-[160px] border border-line/60 bg-mist p-0.5 object-cover"
      }
    />
  );
}

function DecorItem({ item, compact }: { item: LetterDecor; compact: boolean }) {
  if (item.kind === "stamp") return <StampMark id={item.value} compact={compact} />;

  if (item.kind === "sticker") {
    const sticker = findSticker(item.value);
    if (!sticker) return null;
    return (
      <span
        aria-hidden="true"
        className={`${compact ? "text-lg" : "text-[2rem]"} leading-none`}
      >
        {sticker.glyph}
      </span>
    );
  }

  return <GifPrint src={item.value} compact={compact} />;
}

/** A tilt per position, so a row of pieces never sits perfectly square. */
const TILTS = [-6, 4, -3, 7, -8, 2];

export function DecorCollage({
  items,
  compact = false,
  className = "",
}: {
  items: LetterDecor[];
  compact?: boolean;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <span aria-hidden="true" className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {items.map((item, index) => (
        <span
          key={`${item.kind}-${item.value}-${index}`}
          className="inline-flex"
          style={{ transform: `rotate(${TILTS[index % TILTS.length]}deg)` }}
        >
          <DecorItem item={item} compact={compact} />
        </span>
      ))}
    </span>
  );
}

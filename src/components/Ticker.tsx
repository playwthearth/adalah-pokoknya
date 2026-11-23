const LABELS = [
  "時を越えた場所",
  "零 · 00",
  "PRIVATE TRANSMISSION",
  "UNIT 00",
  "静かな部屋",
  "BEYOND TIME",
  "二人だけ",
  "MEMORY ARCHIVE",
  "私は私",
  "LINK ESTABLISHED",
];

/**
 * A slow band of repeated marks between the page and the footer. Decorative
 * only — the words are motifs, not content, so it is hidden from assistive tech.
 */
export function Ticker() {
  return (
    <div
      aria-hidden="true"
      className="relative mt-16 overflow-hidden py-2.5"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)",
      }}
    >
      <div className="marquee items-center gap-10">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-10 pr-10">
            {LABELS.map((label) => (
              <span key={label} className="flex items-center gap-10">
                <span className="label whitespace-nowrap text-[9px] tracking-[0.32em]">
                  {label}
                </span>
                <span className="h-1 w-1 shrink-0 rounded-full bg-ember/70" />
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-line/50" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line/50" />
    </div>
  );
}

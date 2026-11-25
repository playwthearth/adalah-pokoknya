/**
 * Decorations for the scrapbook: a five-petal blossom, drifting petals, thin
 * vine strokes, sparkles and the frame ticks. All purely visual, all drawn in
 * currentColor so a single text-* class tints them.
 */

interface MarkProps {
  className?: string;
}

/** The small blossom that signs the page. */
export function Blossom({ className = "" }: MarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill="currentColor" opacity="0.9">
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse
            key={angle}
            cx="20"
            cy="11.5"
            rx="5.1"
            ry="7.4"
            transform={`rotate(${angle} 20 20)`}
            opacity="0.72"
          />
        ))}
      </g>
      <circle cx="20" cy="20" r="2.6" fill="currentColor" opacity="0.95" />
    </svg>
  );
}

/** A large, almost-invisible blossom behind a heading. */
export function BlossomHalo({ className = "" }: MarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 240"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill="currentColor">
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse
            key={angle}
            cx="120"
            cy="64"
            rx="30"
            ry="52"
            transform={`rotate(${angle} 120 120)`}
            opacity="0.28"
          />
        ))}
      </g>
      <circle cx="120" cy="120" r="16" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** Fine stems and buds, drawn the way a pen would trail off the page. */
export function VineLines({ className = "" }: MarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 360 620"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      <g
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      >
        <path d="M18 12C96 96 44 214 120 300s-30 176 62 250" opacity="0.6" />
        <path d="M74 4C152 92 106 212 178 296s-18 182 72 252" opacity="0.38" />
        <path d="M132 8C206 96 166 206 232 292s-8 178 74 246" opacity="0.22" />
      </g>
      <g fill="currentColor">
        <circle cx="286" cy="140" r="2.1" opacity="0.5" />
        <circle cx="96" cy="452" r="1.7" opacity="0.38" />
        <circle cx="212" cy="566" r="1.4" opacity="0.3" />
      </g>
    </svg>
  );
}

const PETALS = [
  { left: "8%", size: 9, delay: "0s", duration: "30s", rotate: "12deg" },
  { left: "26%", size: 6, delay: "7s", duration: "36s", rotate: "-24deg" },
  { left: "48%", size: 8, delay: "3s", duration: "33s", rotate: "40deg" },
  { left: "67%", size: 5, delay: "12s", duration: "38s", rotate: "-8deg" },
  { left: "86%", size: 7, delay: "18s", duration: "34s", rotate: "26deg" },
];

/** A handful of petals drifting down the page, never fast enough to notice. */
export function PetalField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden sm:block"
    >
      {PETALS.map((petal) => (
        <span
          key={petal.left}
          className="petal absolute top-0 text-periwinkle/70"
          style={{
            left: petal.left,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
          }}
        >
          <svg
            viewBox="0 0 12 18"
            width={petal.size * 1.4}
            height={petal.size * 1.9}
            fill="currentColor"
            style={{ transform: `rotate(${petal.rotate})` }}
          >
            <path d="M6 0c4 4 6 7.6 6 10.6C12 14.8 9.3 18 6 18S0 14.8 0 10.6C0 7.6 2 4 6 0Z" />
          </svg>
        </span>
      ))}
    </div>
  );
}

const SPARKS = [
  { left: "12%", top: "22%", size: 10, delay: "0s" },
  { left: "78%", top: "12%", size: 7, delay: "1.8s" },
  { left: "86%", top: "62%", size: 12, delay: "3.4s" },
  { left: "22%", top: "74%", size: 8, delay: "2.6s" },
  { left: "54%", top: "46%", size: 6, delay: "4.2s" },
];

/** Four-point sparkles, drifting almost imperceptibly. */
export function Sparkles({ className = "" }: MarkProps) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute ${className}`}>
      {SPARKS.map((spark) => (
        <svg
          key={`${spark.left}-${spark.top}`}
          viewBox="0 0 24 24"
          width={spark.size}
          height={spark.size}
          fill="currentColor"
          className="hair-drift absolute text-powder/80"
          style={{
            left: spark.left,
            top: spark.top,
            animationDelay: spark.delay,
            animationDuration: "14s",
          }}
        >
          <path d="M12 0c.7 6.2 5.1 10.6 12 12-6.9 1.4-11.3 5.8-12 12-.7-6.2-5.1-10.6-12-12C6.9 10.6 11.3 6.2 12 0Z" />
        </svg>
      ))}
    </div>
  );
}

/** Four right-angle ticks, the way a page frames a plate. */
export function CornerTicks({ className = "" }: MarkProps) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute ${className}`}>
      <span className="absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-plum/30" />
      <span className="absolute -right-px -top-px h-2.5 w-2.5 border-r border-t border-plum/30" />
      <span className="absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l border-plum/30" />
      <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-plum/30" />
    </div>
  );
}

/** The seal at the head of the navigation: a blossom inside a hairline square. */
export function FlowerSeal({ className = "" }: MarkProps) {
  return (
    <span
      className={`relative flex h-9 w-9 items-center justify-center border border-plum/25 transition-colors group-hover:border-plum/60 ${className}`}
    >
      <span aria-hidden="true" className="absolute inset-[5px] border border-periwinkle/60" />
      <Blossom className="relative h-3.5 w-3.5 text-plum" />
    </span>
  );
}

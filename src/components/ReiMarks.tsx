/**
 * Decorative marks for the Rei Ayanami language: hair strands, the moon,
 * right-angle frame ticks and the 00 unit mark. All purely visual.
 */

interface MarkProps {
  className?: string;
}

/** Long flowing strands — a fringe drawn with hairlines. */
export function HairLines({ className = "" }: MarkProps) {
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
        <path d="M12 8C72 86 34 168 84 238s-22 130 24 196 4 108 46 154" opacity="0.75" />
        <path d="M54 2C118 78 76 166 128 236s-14 134 34 198 10 110 58 158" opacity="0.55" />
        <path d="M98 0C160 82 122 154 170 226s-8 136 40 202 12 106 60 160" opacity="0.4" />
        <path d="M142 4C198 78 168 158 210 222s-4 128 40 190 6 104 44 158" opacity="0.28" />
        <path d="M186 10C236 76 214 152 250 214s0 120 36 182 2 100 32 152" opacity="0.18" />
      </g>
      <g fill="currentColor">
        <circle cx="298" cy="126" r="1.4" opacity="0.5" />
        <circle cx="86" cy="470" r="1.1" opacity="0.35" />
      </g>
    </svg>
  );
}

/** The moon she is always standing under. */
export function MoonMark({ className = "" }: MarkProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 240 240" fill="none" className={className}>
      <defs>
        <radialGradient id="rei-moon" cx="36%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="58%" stopColor="#dbe8f1" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#a9c9df" stopOpacity="0.12" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="118" fill="url(#rei-moon)" />
      <circle cx="120" cy="120" r="118" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1" />
      <circle cx="120" cy="120" r="96" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />
      <path
        d="M120 2a118 118 0 0 1 0 236"
        stroke="#a3262f"
        strokeOpacity="0.32"
        strokeWidth="1"
      />
      <circle cx="58" cy="60" r="1.6" fill="#a3262f" fillOpacity="0.6" />
    </svg>
  );
}

/** Four right-angle ticks, the way a viewfinder frames a subject. */
export function CornerTicks({ className = "" }: MarkProps) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute ${className}`}>
      <span className="absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-navy/35" />
      <span className="absolute -right-px -top-px h-2.5 w-2.5 border-r border-t border-navy/35" />
      <span className="absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l border-navy/35" />
      <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-navy/35" />
    </div>
  );
}

/**
 * The unit mark: a hairline square, an inner square, a crimson seam and dot —
 * read as her eye or the core of a plugsuit, whichever you like.
 */
export function ZeroMark({ className = "" }: MarkProps) {
  return (
    <span
      className={`relative flex h-9 w-9 items-center justify-center border border-navy/25 transition-colors group-hover:border-navy/60 ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-[5px] border border-cyan/70 transition-colors group-hover:border-cyan"
      />
      <span aria-hidden="true" className="h-3 w-px bg-ember" />
      <span aria-hidden="true" className="ember-pulse absolute h-1 w-1 rounded-full bg-ember" />
    </span>
  );
}

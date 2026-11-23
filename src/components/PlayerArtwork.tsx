import { motion, useReducedMotion } from "framer-motion";

interface PlayerArtworkProps {
  index: number;
  active: boolean;
  title?: string;
}

const ticks = Array.from({ length: 36 }, (_, i) => i * 10);

export function PlayerArtwork({ index, active, title }: PlayerArtworkProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative aspect-square w-full overflow-hidden border border-navy/15 bg-pale">
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        role="presentation"
      >
        <g fill="none" stroke="#223A4F" strokeOpacity="0.16" strokeWidth="0.5">
          <circle cx="100" cy="100" r="88" />
          <circle cx="100" cy="100" r="72" />
          <circle cx="100" cy="100" r="56" />
        </g>

        <motion.g
          animate={active && !reduceMotion ? { rotate: 360 } : {}}
          transition={{ repeat: Infinity, duration: 70, ease: "linear" }}
          style={{ originX: "100px", originY: "100px" }}
          fill="none"
          stroke="#223A4F"
          strokeOpacity="0.12"
          strokeWidth="0.5"
        >
          <circle cx="100" cy="100" r="64" strokeDasharray="1 5" />
        </motion.g>

        {ticks.map((angle, i) => (
          <line
            key={angle}
            x1="100"
            y1="6"
            x2="100"
            y2={i % 3 === 0 ? 13 : 10}
            stroke="#4F5D68"
            strokeOpacity={i % 3 === 0 ? 0.55 : 0.28}
            strokeWidth="0.6"
            transform={`rotate(${angle} 100 100)`}
          />
        ))}

        <g stroke="#223A4F" strokeOpacity="0.22" strokeWidth="0.5">
          <line x1="100" y1="24" x2="100" y2="176" />
          <line x1="24" y1="100" x2="176" y2="100" />
        </g>

        <circle cx="100" cy="100" r="18" fill="#DBE8F1" fillOpacity="0.75" />
        <circle cx="100" cy="100" r="18" fill="none" stroke="#223A4F" strokeOpacity="0.3" />
        <circle cx="100" cy="100" r="2.4" fill="#A3262F" />

        <g fontFamily="'Space Mono', monospace" fontSize="4.2" fill="#4F5D68" letterSpacing="1">
          <text x="100" y="152" textAnchor="middle">AUDIO CHANNEL</text>
          <text x="100" y="158" textAnchor="middle" opacity="0.6">音声回線</text>
        </g>
      </svg>

      <div className="absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <span className="label tracking-[0.24em] text-navy/75">STEREO</span>
          <span className="font-mono text-[10px] tracking-[0.14em] text-navy/75">
            AE–{String(index + 1).padStart(3, "0")}
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="max-w-[70%] truncate font-display text-sm font-light tracking-wide text-navy/80">
            {title ?? "—"}
          </p>
          {active && (
            <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
              {[0, 1, 2, 3].map((bar) => (
                <span
                  key={bar}
                  className="eq-bar h-full w-[2px] bg-ember/80"
                  style={{ animationDelay: `${bar * 0.16}s` }}
                />
              ))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

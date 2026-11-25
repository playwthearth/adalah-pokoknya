import { useReducedMotion } from "framer-motion";
import { art } from "../data/art";

interface PlayerArtworkProps {
  index: number;
  active: boolean;
  title?: string;
  className?: string;
}

/** The sleeve cycles through the archive, so no two tracks look alike. */
const SLEEVES = [art.scrapbook, art.beach, art.dream, art.phones];

export function PlayerArtwork({ index, active, title, className }: PlayerArtworkProps) {
  const reduceMotion = useReducedMotion();
  const plate = SLEEVES[index % SLEEVES.length];
  const spinning = active && !reduceMotion;

  return (
    <div
      aria-hidden="true"
      className={`relative aspect-square w-full ${className ?? ""}`}
    >
      {/* The record, half out of the sleeve. */}
      <div className="absolute inset-y-[7%] -right-[8%] aspect-square w-[90%]">
        <div
          className={`vinyl-disc h-full w-full rounded-full ${spinning ? "vinyl-spin" : ""}`}
        >
          <span className="absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lavender ring-1 ring-white/50" />
          <span className="absolute left-1/2 top-1/2 h-[4%] w-[4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85" />
        </div>
      </div>

      {/* The sleeve itself: a printed plate, a title, a side mark. */}
      <figure className="polaroid relative flex h-full flex-col p-2.5">
        <div className="relative h-[72%] overflow-hidden">
          <img
            src={plate}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/70 to-transparent" />
          {active && (
            <span className="absolute right-2 top-2 flex h-4 items-end gap-[3px]">
              {[0, 1, 2, 3].map((bar) => (
                <span
                  key={bar}
                  className="eq-bar h-full w-[2px] bg-plum/80"
                  style={{ animationDelay: `${bar * 0.16}s` }}
                />
              ))}
            </span>
          )}
        </div>

        {/* The printed band of the sleeve — nothing sits on top of the plate. */}
        <div className="flex flex-1 flex-col justify-center px-1 pt-1.5">
          <p className="line-clamp-2 font-display text-[15px] italic leading-tight text-[#343440]">
            {title ?? "—"}
          </p>
          <p className="label mt-1.5 text-[8px] tracking-[0.22em] text-[#6b6b7d]">
            side a · {String(index + 1).padStart(2, "0")}
          </p>
        </div>
      </figure>
    </div>
  );
}

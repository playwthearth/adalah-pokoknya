import { useReducedMotion } from "framer-motion";
import { art } from "../data/art";

interface PlayerArtworkProps {
  index: number;
  active: boolean;
  title?: string;
  /** The song's own cover art, when its file carries one. */
  cover?: string | null;
  className?: string;
}

/** The sleeve cycles through the archive, so no two tracks look alike. */
const SLEEVES = [
  art.scrapbook,
  art.beach,
  art.dream,
  art.phones,
  art.window,
  art.winter,
  art.tea,
  art.scarf,
  art.shore,
  art.desks,
  art.faces,
];

export function PlayerArtwork({ index, active, title, cover, className }: PlayerArtworkProps) {
  const reduceMotion = useReducedMotion();
  // A song with its own cover shows that; anything else falls back to a plate.
  const plate = cover || SLEEVES[index % SLEEVES.length];
  const spinning = active && !reduceMotion;

  return (
    <div aria-hidden="true" className={`relative w-full ${className ?? ""}`}>
      {/* The record, half out of the sleeve. */}
      <div className="absolute right-0 top-1/2 aspect-square w-full -translate-y-1/2">
        <div
          className={`vinyl-disc h-full w-full rounded-full ${spinning ? "vinyl-spin" : ""}`}
        >
          <span className="absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lavender ring-1 ring-white/50" />
          <span className="absolute left-1/2 top-1/2 h-[4%] w-[4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85" />
        </div>
      </div>

      {/* The sleeve itself: the cover square, a title, a side mark. */}
      <figure className="polaroid relative flex w-[90%] flex-col p-2.5">
        <div className="relative aspect-square w-full overflow-hidden">
          <img
            src={plate}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
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
        <div className="flex flex-1 flex-col justify-center px-1 pt-2">
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

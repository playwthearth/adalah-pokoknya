interface PlateProps {
  src: string;
  caption?: string;
  /** Tilt in degrees, so prints never sit perfectly square. */
  tilt?: string;
  /** A strip of washi tape along the top edge. */
  tape?: boolean;
  className?: string;
  /** Marginalia: read by the eye, skipped by a screen reader. */
  decorative?: boolean;
}

/**
 * A developed print taped to a page.
 *
 * One component for every plate outside the cover, so the archive keeps the
 * same paper margin, shadow and handwriting wherever it turns up.
 */
export function Plate({
  src,
  caption,
  tilt = "0deg",
  tape = false,
  className = "",
  decorative = true,
}: PlateProps) {
  return (
    <figure
      aria-hidden={decorative ? "true" : undefined}
      className={`polaroid relative ${className}`}
      style={{ transform: `rotate(${tilt})` }}
    >
      {tape && (
        <span
          aria-hidden="true"
          className="tape -top-3 left-1/2 -translate-x-1/2 -rotate-[3deg]"
        />
      )}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-auto w-full"
      />
      {caption && (
        <figcaption className="caption absolute inset-x-0 bottom-1 px-2 text-center text-[13px] leading-tight sm:text-[15px]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

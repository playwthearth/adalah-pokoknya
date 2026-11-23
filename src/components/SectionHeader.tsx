import type { ReactNode } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { CornerTicks } from "./ReiMarks";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  jp?: string;
  description?: string;
  aside?: ReactNode;
}

export function SectionHeader({ eyebrow, title, jp, description, aside }: SectionHeaderProps) {
  const { language } = useLanguage();
  // The Japanese accent word would repeat the title when the site is in Japanese.
  const showJp = jp && language !== "ja";

  return (
    <header className="relative border-b border-line/80 pb-8 sm:pb-10">
      {/* Oversized kana watermark, the ghost of the section's name. */}
      {jp && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 right-0 hidden select-none font-jp text-[clamp(4rem,9vw,7rem)] font-light leading-none text-cyan/35 md:block"
        >
          {jp}
        </span>
      )}

      <div className="relative flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
        <div className="max-w-2xl">
          <p className="label flex items-center gap-3">
            <span aria-hidden="true" className="h-1.5 w-1.5 bg-ember" />
            {eyebrow}
            <span aria-hidden="true" className="h-px w-8 bg-line" />
          </p>
          <h1 className="mt-6 text-4xl font-extralight tracking-tight text-ink sm:text-5xl">
            {title}
            {showJp && (
              <span className="jp ml-3 align-baseline text-sm font-light tracking-[0.2em] text-muted-strong">
                {jp}
              </span>
            )}
          </h1>
          <span aria-hidden="true" className="hair-rule mt-5 block w-24" />
          {description && (
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-strong">
              {description}
            </p>
          )}
        </div>
        {aside && (
          <div className="relative px-3 py-2">
            <CornerTicks className="inset-0" />
            {aside}
          </div>
        )}
      </div>
    </header>
  );
}

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useLanguage } from "../hooks/useLanguage";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  jp?: string;
  description?: string;
  aside?: ReactNode;
}

export function SectionHeader({ eyebrow, title, jp, description, aside }: SectionHeaderProps) {
  const { language } = useLanguage();
  const reduceMotion = useReducedMotion();
  // The Japanese accent word would repeat the title when the site is in Japanese.
  const showJp = jp && language !== "ja";

  // Each line of the header arrives a beat after the last, like a page settling.
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 12, filter: reduceMotion ? "blur(0px)" : "blur(5px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <header className="relative border-b border-line/80 pb-8 sm:pb-10">
      {/* Oversized kana watermark, the ghost of the section's name. */}
      {jp && (
        <motion.span
          aria-hidden="true"
          {...rise(0.05)}
          className="pointer-events-none absolute -top-2 right-0 hidden select-none font-jp text-[clamp(3rem,5.5vw,4.5rem)] font-light leading-none text-cyan/30 md:block"
        >
          {jp}
        </motion.span>
      )}

      <div className="relative flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
        <div className="max-w-2xl">
          <motion.p {...rise(0)} className="label flex items-center gap-3">
            <span aria-hidden="true" className="h-1.5 w-1.5 bg-ember" />
            {eyebrow}
            <motion.span
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="h-px w-8 origin-left bg-line"
            />
          </motion.p>

          <motion.h1
            {...rise(0.08)}
            className="mt-6 text-4xl font-extralight tracking-tight text-ink sm:text-5xl"
          >
            {title}
            {showJp && (
              <span className="jp ml-3 align-baseline text-sm font-light tracking-[0.2em] text-muted-strong">
                {jp}
              </span>
            )}
          </motion.h1>

          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.3, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="hair-rule mt-5 block w-24 origin-left"
          />

          {description && (
            <motion.p
              {...rise(0.16)}
              className="mt-5 max-w-xl text-sm leading-relaxed text-muted-strong"
            >
              {description}
            </motion.p>
          )}
        </div>

        {aside && (
          <motion.div
            {...rise(0.22)}
            className="border border-line/80 bg-white/40 px-3 py-2"
          >
            {aside}
          </motion.div>
        )}
      </div>
    </header>
  );
}

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { Blossom } from "./Marks";

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
  const showJp = Boolean(jp) && language !== "ja";

  // Each line of the header arrives a beat after the last, like a page settling.
  const rise = (delay: number) => ({
    initial: {
      opacity: 0,
      y: reduceMotion ? 0 : 12,
      filter: reduceMotion ? "blur(0px)" : "blur(5px)",
    },
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
          className="jp pointer-events-none absolute -top-4 right-0 hidden select-none text-[clamp(3.4rem,6.5vw,5rem)] font-light leading-none text-lavender md:block"
        >
          {jp}
        </motion.span>
      )}

      <div className="relative flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
        <div className="max-w-2xl">
          <motion.p {...rise(0)} className="label flex items-center gap-2.5">
            <Blossom className="h-3 w-3 text-powder" />
            {eyebrow}
            <motion.span
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="h-px w-10 origin-left bg-periwinkle/70"
            />
          </motion.p>

          <motion.h1
            {...rise(0.08)}
            className="mt-5 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.08] text-ink"
          >
            {title}
            {showJp && (
              <span className="jp ml-3 align-baseline font-serif text-[0.42em] italic tracking-[0.1em] text-plum">
                {jp}
              </span>
            )}
          </motion.h1>

          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.3, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 block h-px w-28 origin-left bg-gradient-to-r from-plum/60 to-transparent"
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
            className="paper-tint px-3.5 py-2"
          >
            {aside}
          </motion.div>
        )}
      </div>
    </header>
  );
}

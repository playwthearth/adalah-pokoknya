import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Ambient } from "../components/Ambient";
import { Clock } from "../components/Clock";
import { CornerTicks, HairLines, MoonMark } from "../components/ReiMarks";
import { useLanguage } from "../hooks/useLanguage";
import { useSettings } from "../hooks/useSettings";
import { formatDate } from "../utils/format";

interface LandingProps {
  onEnter: () => void;
}

export function Landing({ onEnter }: LandingProps) {
  const { t, locale } = useLanguage();
  const { settings } = useSettings();
  const reduceMotion = useReducedMotion();

  const rise = (delay: number) => ({
    initial: {
      opacity: 0,
      y: reduceMotion ? 0 : 16,
      filter: reduceMotion ? "blur(0px)" : "blur(8px)",
    },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <Ambient />
      {/* The room: a frame, a moon, and her hair in the corner of the light. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 border border-navy/12 sm:inset-5"
      />
      <CornerTicks className="inset-3 z-20 sm:inset-5" />
      <MoonMark className="hair-drift pointer-events-none absolute hidden text-cyan/70 sm:block sm:-right-[6%] sm:-top-[18%] sm:w-[40vw] sm:max-w-[560px]" />
      <HairLines className="hair-drift pointer-events-none absolute -left-[4%] top-[22%] hidden h-[64vh] w-[24vw] text-cyan/70 md:block" />

      <span
        aria-hidden="true"
        className="vertical-jp pointer-events-none absolute bottom-24 left-8 z-10 hidden text-[clamp(2.5rem,5vw,4rem)] leading-none text-cyan/60 lg:block"
      >
        零
      </span>

      <header className="relative z-10 flex flex-col gap-5 px-7 pt-7 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-11 sm:pt-9">
        <div>
          <p className="label">{t.landing.eyebrow}</p>
          <p className="label mt-3 flex items-center gap-2.5">
            <span aria-hidden="true" className="signal-dot h-1.5 w-1.5 rounded-full bg-ember" />
            {t.landing.labels.space}
          </p>
          <p aria-hidden="true" className="serial mt-4 text-[9px]">
            00 / 零
          </p>
        </div>
        <div className="sm:text-right">
          <Clock label={t.landing.clockLabel} showDate />
          <p aria-hidden="true" className="serial mt-2.5 text-[9px] text-ember">
            Unit 00
          </p>
        </div>
      </header>

      <p
        aria-hidden="true"
        className="vertical-jp absolute bottom-32 right-9 z-10 hidden text-[10px] text-navy/35 lg:block"
      >
        {t.landing.jp}
      </p>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <motion.p {...rise(0.05)} className="label tracking-[0.3em] text-ember">
          {t.footer.madeFor}
        </motion.p>

        <motion.h1
          {...rise(0.15)}
          className="hero-halo mt-7 font-display text-[clamp(2.7rem,9.5vw,6.5rem)] font-extralight leading-[0.94] tracking-[-0.02em] text-ink"
        >
          A Place
          <br />
          <span className="text-navy/90">Beyond Time</span>
        </motion.h1>

        <motion.div {...rise(0.24)} aria-hidden="true" className="mt-7 flex w-full items-center justify-center gap-3">
          <span className="hair-rule w-16 -scale-x-100" />
          <span className="h-1 w-1 rounded-full bg-ember" />
          <span className="hair-rule w-16" />
        </motion.div>

        <motion.p {...rise(0.3)} className="mt-7 max-w-sm text-sm leading-loose text-navy/75">
          {t.landing.subtitle}
        </motion.p>

        <motion.p {...rise(0.38)} className="mt-3 max-w-md text-[13px] leading-relaxed text-muted-strong">
          {t.landing.greeting}
        </motion.p>

        <motion.div {...rise(0.5)} className="mt-10">
          <button
            type="button"
            onClick={onEnter}
            className="sheen press group relative inline-flex items-center gap-4 border border-navy/70 px-9 py-4 text-navy hover:border-ember hover:bg-navy hover:text-mist sm:px-12"
          >
            <span aria-hidden="true" className="absolute -left-px -top-px h-1.5 w-1.5 bg-ember" />
            <span aria-hidden="true" className="absolute -bottom-px -right-px h-1.5 w-1.5 bg-ember" />
            <span className="font-mono text-[11px] uppercase tracking-[0.42em]">
              {t.landing.enter}
            </span>
            <ArrowRight
              size={15}
              strokeWidth={1.5}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
        </motion.div>

        <motion.p {...rise(0.6)} className="label mt-6 text-[9px] tracking-[0.16em] text-muted-strong">
          {t.landing.hint}
        </motion.p>
      </main>

      <footer className="relative z-10 border-t border-line/60 px-7 py-5 sm:px-11">
        <ul className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          {[
            t.landing.labels.space,
            t.landing.labels.connection,
            t.landing.labels.archive,
            t.landing.labels.transmission,
          ].map((label, index) => (
            <li key={label} className="label flex items-center gap-2 text-[9px]">
              <span aria-hidden="true" className="text-ember">
                0{index + 1}
              </span>
              {label}
            </li>
          ))}
        </ul>
        <p className="serial mt-4 text-[8px] text-muted-strong/80">
          {formatDate(settings.startDate, locale)} — 00
        </p>
      </footer>
    </div>
  );
}

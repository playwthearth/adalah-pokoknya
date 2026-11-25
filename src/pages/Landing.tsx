import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Ambient } from "../components/Ambient";
import { Clock } from "../components/Clock";
import {
  Blossom,
  BlossomHalo,
  CornerTicks,
  PetalField,
  Sparkles,
  VineLines,
} from "../components/Marks";
import { art } from "../data/art";
import { site } from "../data/site";
import { useLanguage } from "../hooks/useLanguage";
import { useSettings } from "../hooks/useSettings";
import { formatDate } from "../utils/format";

interface LandingProps {
  onEnter: () => void;
}

/** The cover of the scrapbook: a layered plate collage and the front matter. */
export function Landing({ onEnter }: LandingProps) {
  const { t, locale } = useLanguage();
  const { settings } = useSettings();
  const reduceMotion = useReducedMotion();

  const rise = (delay: number) => ({
    initial: {
      opacity: 0,
      y: reduceMotion ? 0 : 18,
      filter: reduceMotion ? "blur(0px)" : "blur(7px)",
    },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 1, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <Ambient />
      <PetalField />

      {/* The sheet is framed like a printed page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 border border-line sm:inset-5"
      />
      <CornerTicks className="inset-3 z-20 sm:inset-5" />

      <span
        aria-hidden="true"
        className="vertical-jp pointer-events-none absolute bottom-32 left-6 z-10 hidden text-[11px] tracking-[0.5em] text-plum/45 lg:block"
      >
        薫る花は凛と咲く
      </span>
      <span
        aria-hidden="true"
        className="vertical-jp pointer-events-none absolute right-6 top-[32%] z-10 hidden text-[10px] tracking-[0.45em] text-plum/30 lg:block"
      >
        {site.jpTitle}
      </span>

      <header className="relative z-10 flex items-start justify-between gap-6 px-7 pt-7 sm:px-11 sm:pt-9">
        <div>
          <p className="label">{t.landing.eyebrow}</p>
          <p className="caption mt-2 text-[17px] text-plum/90">
            a scrapbook, kept for two
          </p>
        </div>
        <div className="text-right">
          <Clock label={t.landing.clockLabel} showDate />
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
        {/* The collage: three plates, taped down, edges feathered. */}
        <div className="relative order-1 mx-auto w-full max-w-[430px] lg:order-2 lg:max-w-none">
          <div className="relative aspect-[4/5] w-full">
            {/* A lavender wash under the prints, so the cluster has a ground. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-8 inset-y-12 rounded-full bg-lavender/80 blur-3xl"
            />
            <BlossomHalo className="pointer-events-none absolute -left-16 -top-12 h-40 w-40 text-periwinkle/45" />
            <VineLines className="pointer-events-none absolute -right-10 -top-10 hidden h-[46%] w-24 text-periwinkle/40 sm:block" />
            <motion.figure
              {...rise(0.16)}
              className="polaroid absolute right-[2%] top-0 w-[52%] rotate-[2.5deg]"
            >
              <span aria-hidden="true" className="tape -top-3 left-1/2 -translate-x-1/2 -rotate-[4deg]" />
              <img
                src={art.subaru}
                alt=""
                width={736}
                height={1173}
                decoding="async"
                className="soft-mask aspect-[3/4] w-full object-cover"
              />
              <figcaption className="caption absolute inset-x-0 bottom-1.5 px-2 text-center text-[13px] leading-tight sm:text-[16px]">
                it&rsquo;s our little secret.
              </figcaption>
            </motion.figure>

            <motion.figure
              {...rise(0.26)}
              className="polaroid absolute left-0 top-[22%] w-[55%] -rotate-[3deg]"
            >
              <span aria-hidden="true" className="tape -top-3 right-4 rotate-[5deg]" />
              <img
                src={art.saku}
                alt=""
                width={736}
                height={1056}
                decoding="async"
                className="soft-mask aspect-[3/4] w-full object-cover"
              />
              <figcaption className="caption absolute inset-x-0 bottom-1.5 px-2 text-center text-[13px] leading-tight sm:text-[16px]">
                you&rsquo;ll always be my favourite.
              </figcaption>
            </motion.figure>

            <motion.figure
              {...rise(0.38)}
              className="polaroid absolute bottom-0 right-[4%] w-[46%] rotate-[1.5deg]"
            >
              <img
                src={art.closeup}
                alt=""
                width={517}
                height={312}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
              <figcaption className="caption absolute inset-x-0 bottom-1.5 px-2 text-center text-[13px] leading-tight sm:text-[16px]">
                you and i, together.
              </figcaption>
            </motion.figure>

            <Sparkles className="inset-0" />
          </div>
        </div>

        {/* Front matter. */}
        <div className="order-2 lg:order-1">
          <motion.p {...rise(0)} className="caption text-[18px] text-plum">
            the two of us, on paper
          </motion.p>

          <motion.h1
            {...rise(0.08)}
            className="mt-3 font-display text-[clamp(2.7rem,7.6vw,5rem)] font-normal leading-[1.02] tracking-[-0.01em] text-ink"
          >
            A Place
            <br />
            <span className="italic text-plum">Beyond</span> Time
          </motion.h1>

          <motion.div
            {...rise(0.16)}
            aria-hidden="true"
            className="mt-6 flex items-center gap-3"
          >
            <span className="hair-rule w-10" />
            <Blossom className="h-3.5 w-3.5 text-powder" />
            <span className="hair-rule w-24 -scale-x-100" />
          </motion.div>

          <motion.p
            {...rise(0.22)}
            className="mt-6 max-w-md text-[15px] leading-[1.9] text-navy/85"
          >
            {t.landing.subtitle}
          </motion.p>

          <motion.p
            {...rise(0.28)}
            className="mt-3 max-w-md text-[13px] leading-relaxed text-muted-strong"
          >
            {t.landing.greeting}
          </motion.p>

          <motion.div {...rise(0.36)} className="mt-9">
            <button
              type="button"
              onClick={onEnter}
              className="sheen press group inline-flex w-full items-center justify-between gap-6 rounded-full border border-plum/35 bg-surface/90 px-7 py-4 text-navy shadow-[0_18px_36px_-30px_rgba(119,125,170,0.9)] transition-colors hover:border-plum hover:bg-lavender/50 sm:w-auto"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.34em]">
                {t.landing.enter}
              </span>
              <ArrowRight
                size={16}
                strokeWidth={1.4}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </motion.div>

          <motion.p
            {...rise(0.44)}
            className="caption mt-5 text-[16px] text-muted-strong"
          >
            {t.landing.hint}
          </motion.p>
        </div>
      </main>

      {/* Three plates from the archive, laid along the bottom of the cover. */}
      <section
        aria-hidden="true"
        className="relative z-10 mx-auto hidden w-full max-w-6xl gap-5 px-10 pb-9 sm:grid sm:grid-cols-3"
      >
        {[
          { src: art.beach, caption: "stay with me.", rotate: "-1.2deg" },
          { src: art.phones, caption: "you and i are…", rotate: "1deg" },
          { src: art.scrapbook, caption: "belong to each other.", rotate: "-0.6deg" },
        ].map((plate) => (
          <figure
            key={plate.src}
            className="polaroid relative"
            style={{ transform: `rotate(${plate.rotate})` }}
          >
            <img
              src={plate.src}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full object-cover object-center"
            />
            <figcaption className="caption absolute inset-x-0 bottom-1.5 text-center">
              {plate.caption}
            </figcaption>
          </figure>
        ))}
      </section>

      <footer className="relative z-10 border-t border-line/80 px-7 py-5 sm:px-11">
        <ul className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          {[
            t.landing.labels.space,
            t.landing.labels.connection,
            t.landing.labels.archive,
            t.landing.labels.transmission,
          ].map((label, index) => (
            <li key={label} className="label flex items-center gap-2 text-[9px]">
              <span aria-hidden="true" className="text-plum/70">
                0{index + 1}
              </span>
              {label}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="caption text-[15px] text-muted-strong">
            {t.footer.madeFor}
          </p>
          <p className="serial text-[8px] text-muted-strong/80">
            {formatDate(settings.startDate, locale)} — 00
          </p>
        </div>
      </footer>
    </div>
  );
}

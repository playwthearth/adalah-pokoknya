import type { CSSProperties } from "react";
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

/** Loose plates kept in the back of the scrapbook, pinned in as they came. */
const SPREAD = [
  { src: art.window, caption: "the same window.", tilt: "-1.6deg", w: 550, h: 550 },
  { src: art.desks, caption: "an afternoon apart.", tilt: "1.4deg", w: 378, h: 378 },
  { src: art.tea, caption: "tea, before the light.", tilt: "-1.1deg", w: 736, h: 781 },
  { src: art.winter, caption: "winter, together.", tilt: "1.8deg", w: 736, h: 627 },
  { src: art.scarf, caption: "you, looking away.", tilt: "-1.4deg", w: 704, h: 703 },
  { src: art.faces, caption: "so close.", tilt: "1.2deg", w: 735, h: 850 },
  { src: art.shore, caption: "the sea between us.", tilt: "-0.9deg", w: 736, h: 736 },
  { src: art.dream, caption: "the same dream.", tilt: "1.1deg", w: 735, h: 805 },
] as const;

/** The cover of the scrapbook: a taped triptych and the front matter. */
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
    transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as const },
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
        className="vertical-jp pointer-events-none absolute right-6 top-[30%] z-10 hidden text-[10px] tracking-[0.45em] text-plum/30 xl:block"
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

      {/* The cover fills the screen it is given: the collage is measured in
          viewport height on wide screens, so a tall window grows the plates
          instead of opening a band of empty paper above and below them. */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-6 py-7 sm:px-10 sm:py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] md:gap-9 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-14 lg:py-5">
        <div
          className="relative order-1 mx-auto w-full max-w-[330px] md:order-2 md:mx-0 md:max-w-none lg:h-[var(--cover-h)]"
          style={{ "--cover-h": "clamp(450px, 62vh, 600px)" } as CSSProperties}
        >
          <div className="relative aspect-[3/4] w-full lg:ml-auto lg:h-full lg:w-[calc(var(--cover-h)*0.75)] lg:aspect-auto">
            {/* Lavender wash and foliage, laid under the prints. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-6 inset-y-10 rounded-full bg-lavender/80 blur-3xl"
            />
            <BlossomHalo className="pointer-events-none absolute -left-12 -top-10 h-36 w-36 text-periwinkle/45" />
            <VineLines className="pointer-events-none absolute -right-8 -top-8 hidden h-[42%] w-20 text-periwinkle/40 sm:block" />

            {/* Left print: Saku. */}
            <motion.figure
              {...rise(0.2)}
              className="polaroid absolute left-0 top-[2%] w-[47%] -rotate-[2.5deg]"
            >
              <span aria-hidden="true" className="tape -top-3 left-6 -rotate-[4deg]" />
              <img
                src={art.saku}
                alt=""
                width={736}
                height={1056}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="soft-mask aspect-[3/4] w-full object-cover object-[50%_40%]"
              />
              <figcaption className="caption absolute inset-x-0 bottom-1.5 px-2 text-center text-[11.5px] leading-tight sm:text-[12.5px] lg:text-[15px]">
                you&rsquo;ll always be my favourite.
              </figcaption>
            </motion.figure>

            {/* Right print: Subaru, crop biased to the bed and the water. */}
            <motion.figure
              {...rise(0.3)}
              className="polaroid absolute right-0 top-0 w-[49%] rotate-[2deg]"
            >
              <span aria-hidden="true" className="tape -top-3 right-6 rotate-[4deg]" />
              <img
                src={art.subaru}
                alt=""
                width={736}
                height={1173}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="soft-mask aspect-[3/4] w-full object-cover object-[50%_58%]"
              />
              <figcaption className="caption absolute inset-x-0 bottom-1.5 px-2 text-center text-[11.5px] leading-tight sm:text-[12.5px] lg:text-[15px]">
                it&rsquo;s our little secret.
              </figcaption>
            </motion.figure>

            {/* Landscape print laid across the bottom of both, the way a third
                photo gets slipped into a scrapbook page. */}
            <motion.figure
              {...rise(0.42)}
              className="polaroid absolute bottom-0 left-[22%] w-[56%] -rotate-[1.2deg]"
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
              <figcaption className="caption absolute inset-x-0 bottom-1.5 px-2 text-center text-[11.5px] leading-tight sm:text-[12.5px] lg:text-[15px]">
                you and i, together.
              </figcaption>
            </motion.figure>

            <Sparkles className="inset-0" />
          </div>
        </div>

        {/* Front matter. */}
        <div className="order-2 min-w-0 md:order-1">
          <motion.p {...rise(0)} className="caption text-[18px] text-plum">
            the two of us, on paper
          </motion.p>

          <motion.h1
            {...rise(0.08)}
            className="mt-3 font-display text-[clamp(2.6rem,6.4vw,4.6rem)] font-normal leading-[1.02] tracking-[-0.01em] text-ink"
          >
            A Place
            <br />
            <span className="italic text-plum">Beyond</span> Time
          </motion.h1>

          <motion.div
            {...rise(0.16)}
            aria-hidden="true"
            className="mt-5 flex items-center gap-3"
          >
            <span className="hair-rule w-10" />
            <Blossom className="h-3.5 w-3.5 text-powder" />
            <span className="hair-rule w-20 -scale-x-100" />
          </motion.div>

          <motion.p
            {...rise(0.22)}
            className="mt-5 max-w-md text-[15px] leading-[1.85] text-navy/85"
          >
            {t.landing.subtitle}
          </motion.p>

          <motion.p
            {...rise(0.28)}
            className="mt-2.5 max-w-md text-[13px] leading-relaxed text-muted-strong"
          >
            {t.landing.greeting}
          </motion.p>

          <motion.div {...rise(0.36)} className="mt-8">
            <button
              type="button"
              onClick={onEnter}
              className="sheen press group inline-flex w-full items-center justify-between gap-6 rounded-full border border-plum/70 bg-surface/90 px-7 py-4 text-navy shadow-[0_18px_36px_-30px_rgba(119,125,170,0.9)] transition-colors hover:border-plum hover:bg-lavender/50 sm:w-auto"
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
            className="caption mt-4 text-[16px] text-muted-strong"
          >
            {t.landing.hint}
          </motion.p>
        </div>
      </main>

      {/* Three plates from the archive, laid along the bottom of the cover. */}
      <section
        aria-hidden="true"
        className="relative z-10 mx-auto hidden w-full max-w-6xl gap-5 px-10 pb-8 sm:grid sm:grid-cols-3"
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

      {/* The rest of the shoebox: plates slipped in wherever they fit. */}
      <section
        aria-labelledby="plates-heading"
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-14 pt-2 sm:px-10"
      >
        <div className="flex items-baseline gap-4">
          <h2 id="plates-heading" className="label">
            {t.landing.plates}
          </h2>
          <span aria-hidden="true" className="hair-rule hidden flex-1 sm:block" />
          <p className="caption text-[15px] text-muted-strong">{t.landing.platesNote}</p>
        </div>

        <div className="mt-7 columns-2 gap-3.5 sm:columns-3 sm:gap-5 lg:columns-4">
          {SPREAD.map((plate, index) => (
            <motion.figure
              key={plate.src}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7, delay: (index % 4) * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="polaroid relative mb-3.5 break-inside-avoid sm:mb-5"
              style={{ rotate: plate.tilt }}
            >
              {index % 3 === 0 && (
                <span
                  aria-hidden="true"
                  className="tape -top-3 left-1/2 -translate-x-1/2 -rotate-[3deg]"
                />
              )}
              <img
                src={plate.src}
                alt=""
                width={plate.w}
                height={plate.h}
                loading="lazy"
                decoding="async"
                className="h-auto w-full"
              />
              <figcaption className="caption absolute inset-x-0 bottom-1 px-2 text-center text-[13px] leading-tight sm:text-[15px]">
                {plate.caption}
              </figcaption>
            </motion.figure>
          ))}
        </div>
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

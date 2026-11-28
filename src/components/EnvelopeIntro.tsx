import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { Blossom } from "./Marks";

/**
 * A short opening: the envelope's flap lifts, a folded sheet rises out of it,
 * and the letter takes over. It runs once per visit, can be skipped at any
 * moment, and collapses to nothing when the reader prefers reduced motion.
 */
export function EnvelopeIntro({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [flapOpen, setFlapOpen] = useState(false);
  const [rising, setRising] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      onDone();
      return;
    }

    const flap = window.setTimeout(() => setFlapOpen(true), 160);
    const rise = window.setTimeout(() => setRising(true), 640);
    const done = window.setTimeout(onDone, 1500);
    return () => {
      window.clearTimeout(flap);
      window.clearTimeout(rise);
      window.clearTimeout(done);
    };
  }, [onDone, reduceMotion]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[92] flex flex-col items-center justify-center gap-10 bg-scrim/50 px-6 backdrop-blur-[2px]"
    >
      <div className="relative h-44 w-72 sm:h-52 sm:w-96" style={{ perspective: "900px" }}>
        {/* The folded sheet, rising out of the envelope before the reader appears. */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-6 bottom-6 h-32 border border-line bg-mist shadow-[0_18px_38px_-28px_rgba(34,58,79,0.6)]"
          initial={{ y: 12, opacity: 0 }}
          animate={rising ? { y: -34, opacity: 1 } : { y: 12, opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="absolute inset-x-6 top-7 h-px bg-line/80" />
          <span className="absolute inset-x-6 top-11 h-px bg-line/60" />
          <span className="absolute inset-x-6 top-[3.75rem] h-px bg-line/40" />
        </motion.div>

        {/* The body of the envelope. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-36 border border-navy/25 bg-pale sm:h-40"
        >
          <span className="absolute inset-x-0 top-0 h-px bg-navy/10" />
          <span
            className="absolute inset-x-0 bottom-0 h-16 border-t border-navy/15 bg-lavender/40"
            style={{ clipPath: "polygon(0 100%, 50% 0, 100% 100%)" }}
          />
        </div>

        {/* The flap, hinged along the top edge. */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 origin-top border border-navy/25 bg-lavender/70"
          style={{
            height: "5.25rem",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            transformStyle: "preserve-3d",
          }}
          animate={flapOpen ? { rotateX: 168, opacity: 0.75 } : { rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.span
          aria-hidden="true"
          className="absolute bottom-[3.9rem] left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-plum/40 bg-plum/10"
          animate={{ opacity: rising ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Blossom className="h-4 w-4 text-plum" />
        </motion.span>
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <p className="label">{t.letters.envelopeHint}</p>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex min-h-11 items-center border border-line/80 bg-mist/80 px-5 font-mono text-[10px] uppercase tracking-[0.18em] text-navy transition-colors hover:border-navy/40 hover:text-ink"
        >
          {t.letters.envelopeSkip}
        </button>
      </div>
    </div>
  );
}

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useEffect } from "react";
import { useLanguage } from "../hooks/useLanguage";
import type { Memory } from "../types";
import { formatDate } from "../utils/format";

interface LightboxProps {
  memories: Memory[];
  index: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
}

export function Lightbox({ memories, index, onClose, onChange }: LightboxProps) {
  const { t, language, locale } = useLanguage();
  const reduceMotion = useReducedMotion();
  const open = index !== null;
  const memory = index !== null ? memories[index] : null;

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" && index !== null) {
        onChange((index + 1) % memories.length);
      }
      if (event.key === "ArrowLeft" && index !== null) {
        onChange((index - 1 + memories.length) % memories.length);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, index, memories.length, onChange, onClose]);

  return (
    <AnimatePresence>
      {open && memory && (
        <motion.div
          className="fixed inset-0 z-[90] flex flex-col bg-mist"
          role="dialog"
          aria-modal="true"
          aria-label={memory.title[language]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between border-b border-line/70 px-5 py-4 sm:px-8">
            <p className="label">
              {String((index ?? 0) + 1).padStart(2, "0")} /{" "}
              {String(memories.length).padStart(2, "0")}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.memories.close}
              className="inline-flex h-9 w-9 items-center justify-center border border-line text-navy transition-colors hover:border-navy/40"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-5 py-8 lg:flex-row lg:items-center lg:gap-14 lg:px-14">
            <motion.figure
              key={memory.id}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="m-0 w-full max-w-3xl shrink"
            >
              <img
                src={memory.image}
                alt={memory.title[language]}
                width={1184}
                height={880}
                className="max-h-[58vh] w-full border border-line/80 object-cover"
              />
            </motion.figure>

            <div className="w-full max-w-sm shrink-0 lg:max-w-xs">
              <p className="label">{formatDate(memory.date, locale)}</p>
              <h2 className="mt-4 font-display text-3xl font-extralight text-ink">
                {memory.title[language]}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-strong">
                {memory.description[language]}
              </p>

              <div className="mt-8 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange(((index ?? 0) - 1 + memories.length) % memories.length)}
                  aria-label={t.memories.previous}
                  className="inline-flex h-10 w-10 items-center justify-center border border-line text-navy transition-colors hover:border-navy/40"
                >
                  <ArrowLeft size={15} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(((index ?? 0) + 1) % memories.length)}
                  aria-label={t.memories.next}
                  className="inline-flex h-10 w-10 items-center justify-center border border-line text-navy transition-colors hover:border-navy/40"
                >
                  <ArrowRight size={15} strokeWidth={1.5} />
                </button>
                <span className="jp ml-3 hidden text-[10px] tracking-[0.3em] text-muted-strong sm:block">
                  記憶
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

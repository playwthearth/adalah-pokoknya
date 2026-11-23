import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  closeLabel?: string;
  wide?: boolean;
}

export function Modal({ open, onClose, children, label, closeLabel, wide = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    // Move focus into the dialog once it is painted.
    const focusId = window.setTimeout(() => panelRef.current?.focus(), 40);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusId);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="fixed inset-0 bg-navy/25 backdrop-blur-[3px]"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={`relative my-auto w-full ${
              wide ? "max-w-4xl" : "max-w-2xl"
            } border border-line bg-mist shadow-[0_40px_120px_-50px_rgba(24,44,60,0.55)] outline-none`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.995 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel ?? t.common.close}
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center border border-line/80 bg-mist/90 text-muted-strong transition-colors hover:border-navy/30 hover:text-ink"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

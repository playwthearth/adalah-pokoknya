import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useLanguage } from "../hooks/useLanguage";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  closeLabel?: string;
  wide?: boolean;
  /** id of the heading that names the dialog, when there is one. */
  labelledBy?: string;
}

export function Modal({
  open,
  onClose,
  children,
  label,
  closeLabel,
  wide = false,
  labelledBy,
}: ModalProps) {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const panelRef = useFocusTrap<HTMLDivElement>(open, onClose);

  // The dialog covers the page, so the page behind it must not scroll.
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Portalled to <body> so `fixed` resolves against the viewport even though
  // the page transition animates a filter on an ancestor.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="fixed inset-0 bg-scrim/45 backdrop-blur-[3px]"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={labelledBy ? undefined : label}
            aria-labelledby={labelledBy}
            tabIndex={-1}
            className={`relative my-auto w-full ${
              wide ? "max-w-4xl" : "max-w-2xl"
            } border border-line bg-mist shadow-[0_40px_120px_-50px_rgba(8,16,24,0.6)] outline-none`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.995 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel ?? t.common.close}
              className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center border border-line/80 bg-mist/90 text-muted-strong transition-colors hover:border-navy/30 hover:text-ink"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

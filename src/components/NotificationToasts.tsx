import { AnimatePresence, motion } from "framer-motion";
import { Image as ImageIcon, PenLine, X } from "lucide-react";
import type { Route } from "../hooks/useHashRoute";
import { useLanguage } from "../hooks/useLanguage";
import type { NotificationKind } from "../hooks/useNotifications";
import { useNotifications } from "../hooks/useNotifications";
import { relativeTime } from "../utils/format";

interface NotificationToastsProps {
  onNavigate: (route: Route) => void;
}

/**
 * What arrives while the page is open slides in over the corner the way a
 * laptop or a phone announces it: one card per arrival, a moment on screen,
 * gone unless it is opened. The bell keeps the list for whoever was away.
 */
export function NotificationToasts({ onNavigate }: NotificationToastsProps) {
  const { t, locale } = useLanguage();
  const { toasts, dismissToast, markSeen } = useNotifications();

  const open = (id: string, kind: NotificationKind) => {
    markSeen(kind);
    dismissToast(id);
    onNavigate(kind);
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-3 top-[4.5rem] z-[86] flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:top-[5.25rem] sm:w-[23rem]"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex items-start gap-3 border border-l-2 border-line/80 border-l-plum/70 bg-mist px-3.5 py-3 shadow-[0_18px_38px_-26px_rgba(52,52,64,0.55)]"
          >
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center border border-line/70 bg-lavender/30 text-navy">
              {toast.kind === "notes" ? (
                <PenLine size={14} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <ImageIcon size={14} strokeWidth={1.5} aria-hidden="true" />
              )}
            </span>

            <a
              href={`#/${toast.kind}`}
              onClick={(event) => {
                event.preventDefault();
                open(toast.id, toast.kind);
              }}
              className="min-w-0 flex-1"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="label text-[9px]">
                  {toast.kind === "notes"
                    ? t.notifications.noteTitle
                    : t.notifications.memoryTitle}
                </span>
                <span className="serial shrink-0 text-[8px] text-muted-strong/80">
                  {relativeTime(toast.createdAt, locale)}
                </span>
              </span>
              <span className="mt-1 line-clamp-2 font-serif text-[15px] leading-snug text-ink">
                {toast.text || t.notifications.untitled}
              </span>
              {toast.author && (
                <span className="caption mt-0.5 block truncate text-[13px] text-muted-strong">
                  {toast.author}
                </span>
              )}
            </a>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label={t.notifications.close}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-strong transition-colors hover:text-ink"
            >
              <X size={13} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

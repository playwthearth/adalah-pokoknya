import { Bell, CheckCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Route } from "../hooks/useHashRoute";
import { useLanguage } from "../hooks/useLanguage";
import { useNotifications, type NotificationItem } from "../hooks/useNotifications";

interface NotificationBellProps {
  onNavigate: (route: Route) => void;
}

/** "just now", "two hours ago" — translated by the browser, no extra strings. */
function relativeTime(iso: string, locale: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((then - Date.now()) / 60000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return format.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return format.format(hours, "hour");
  return format.format(Math.round(hours / 24), "day");
}

/**
 * The bell in the masthead: what the other person has added since this device
 * last opened the room it lives in. Nothing is fetched for a closed panel — the
 * count comes from the notes and memories already on screen.
 */
export function NotificationBell({ onNavigate }: NotificationBellProps) {
  const { t, locale } = useLanguage();
  const { items, unread, markSeen } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement | null>(null);
  const button = useRef<HTMLButtonElement | null>(null);

  // Close on Escape (returning the focus to the bell) and on an outside press.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapper.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const openItem = (item: NotificationItem) => {
    markSeen(item.kind);
    setOpen(false);
    onNavigate(item.kind);
  };

  const label = unread > 0 ? `${t.notifications.label} (${unread})` : t.notifications.label;

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls="notification-panel"
        className={`relative inline-flex h-10 w-10 items-center justify-center border transition-colors ${
          open
            ? "border-navy/40 text-ink"
            : "border-line/80 text-muted-strong hover:border-navy/30 hover:text-ink"
        }`}
      >
        <Bell size={15} strokeWidth={1.5} aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 font-mono text-[9px] leading-none text-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notification-panel"
          role="region"
          aria-label={t.notifications.label}
          className="fixed inset-x-2 top-[4.25rem] z-60 border border-line/80 bg-mist shadow-[0_24px_50px_-32px_rgba(52,52,64,0.55)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[20rem]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3">
            <span className="label">{t.notifications.label}</span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    markSeen("notes");
                    markSeen("memories");
                  }}
                  className="btn-quiet min-h-9 px-1 text-[9px]"
                >
                  <CheckCheck size={12} strokeWidth={1.5} aria-hidden="true" />
                  {t.notifications.markAll}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.notifications.close}
                className="inline-flex h-9 w-9 items-center justify-center text-muted-strong transition-colors hover:text-ink"
              >
                <X size={14} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6">
              <p className="font-serif text-[15px] text-navy">{t.notifications.empty}</p>
              <p className="caption mt-1 text-[14px] text-muted-strong">
                {t.notifications.emptyHint}
              </p>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="border-b border-line/50 last:border-b-0">
                  <a
                    href={`#/${item.kind}`}
                    onClick={(event) => {
                      event.preventDefault();
                      openItem(item);
                    }}
                    className="block px-4 py-3 transition-colors hover:bg-surface/70"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="label text-[9px]">
                        {item.kind === "notes"
                          ? t.notifications.noteTitle
                          : t.notifications.memoryTitle}
                      </span>
                      <span className="serial shrink-0 text-[8px] text-muted-strong/80">
                        {relativeTime(item.createdAt, locale)}
                      </span>
                    </span>
                    <span className="mt-1 block truncate font-serif text-[15px] text-ink">
                      {item.text || t.notifications.untitled}
                    </span>
                    {item.author && (
                      <span className="caption mt-0.5 block text-[13px] text-muted-strong">
                        {item.author}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

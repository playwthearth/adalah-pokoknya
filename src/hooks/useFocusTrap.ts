import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (node) => node.offsetParent !== null,
  );
}

/**
 * Keeps keyboard focus inside an open dialog: moves it in on open (unless a
 * child already has it), wraps Tab/Shift+Tab at the edges, handles Escape, and
 * returns focus to whatever had it before on close.
 *
 * The effect deliberately depends only on `open`: the close callback is read
 * through a ref, so an inline arrow from the parent cannot re-trap on every
 * render.
 */
export function useFocusTrap<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;

    const timer = window.setTimeout(() => {
      if (!node || node.contains(document.activeElement)) return;
      const items = focusableWithin(node);
      // preventScroll matters: focusing an element inside a scrollable sheet
      // otherwise scrolls its header out of sight the moment it opens.
      (items[0] ?? node).focus({ preventScroll: true });
    }, 30);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !node) return;

      const items = focusableWithin(node);
      if (items.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const start = items[0];
      const end = items[items.length - 1];
      if (event.shiftKey && document.activeElement === start) {
        event.preventDefault();
        end.focus();
      } else if (!event.shiftKey && document.activeElement === end) {
        event.preventDefault();
        start.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown, true);
      previous?.focus?.({ preventScroll: true });
    };
  }, [open]);

  return ref;
}

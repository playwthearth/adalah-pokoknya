import { useCallback, useSyncExternalStore } from "react";

/**
 * True while the viewport matches a media query, and again as soon as it stops.
 *
 * Where one picture has to move between two different layouts, CSS can only do
 * it by drawing it twice; this lets the card keep a single copy and hand it to
 * whichever side of the breakpoint is on screen.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);

      // A changed viewport does not always announce itself — a browser window
      // that is resized programmatically, or zoomed, can cross the breakpoint
      // with no media event — so the page's own width is watched as well.
      let width = window.innerWidth;
      const observer = new ResizeObserver(() => {
        if (window.innerWidth === width) return;
        width = window.innerWidth;
        onChange();
      });
      observer.observe(document.documentElement);

      return () => {
        list.removeEventListener("change", onChange);
        observer.disconnect();
      };
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

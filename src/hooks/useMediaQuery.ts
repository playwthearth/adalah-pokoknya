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
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

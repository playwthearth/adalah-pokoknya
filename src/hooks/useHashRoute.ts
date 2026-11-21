import { useCallback, useEffect, useState } from "react";

export type Route = "dashboard" | "letters" | "memories" | "playlist" | "settings";

export const routes: Route[] = [
  "dashboard",
  "letters",
  "memories",
  "playlist",
  "settings",
];

function parse(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "").split("?")[0];
  return (routes as string[]).includes(clean) ? (clean as Route) : "dashboard";
}

export function useHashRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parse(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    const target = `#/${next}`;
    if (window.location.hash === target) {
      setRoute(next);
      return;
    }
    window.location.hash = target;
    setRoute(next);
  }, []);

  return [route, navigate];
}

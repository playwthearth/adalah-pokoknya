import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Menu, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { site } from "../data/site";
import type { Route } from "../hooks/useHashRoute";
import { useLanguage } from "../hooks/useLanguage";
import { LanguageSelector } from "./LanguageSelector";
import { ZeroMark } from "./ReiMarks";

interface NavbarProps {
  route: Route;
  onNavigate: (route: Route) => void;
}

const order: {
  route: Route;
  key: "dashboard" | "letters" | "memories" | "playlist" | "notes";
}[] = [
  { route: "dashboard", key: "dashboard" },
  { route: "letters", key: "letters" },
  { route: "memories", key: "memories" },
  { route: "playlist", key: "playlist" },
  { route: "notes", key: "notes" },
];

export function Navbar({ route, onNavigate }: NavbarProps) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  // Close the mobile drawer when the route changes, on Escape, and lock scroll.
  useEffect(() => {
    setMenuOpen(false);
  }, [route]);

  useEffect(() => {
    if (!menuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-mist/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <button
            type="button"
            onClick={() => onNavigate("dashboard")}
            aria-label={t.nav.dashboard}
            className="group flex items-center gap-3 text-left"
          >
            <ZeroMark />
            <span className="leading-none">
              <span className="block font-display text-[12px] uppercase tracking-[0.24em] text-ink">
                Beyond Time
              </span>
              <span className="jp mt-1 block text-[9px] tracking-[0.3em] text-muted-strong">
                {site.jpTitle}
              </span>
            </span>
          </button>

          <nav
            aria-label={t.nav.primary}
            className="hidden items-center gap-7 lg:flex"
          >
            {order.map((item, index) => (
              <button
                key={item.route}
                type="button"
                onClick={() => onNavigate(item.route)}
                aria-current={route === item.route ? "page" : undefined}
                data-active={route === item.route}
                className="link-underline group relative flex items-baseline gap-2"
              >
                <span className="font-mono text-[9px] text-muted-strong transition-colors group-data-[active=true]:text-ember">
                  0{index + 1}
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-navy/75 transition-colors group-hover:text-ink group-data-[active=true]:text-ink">
                  {t.nav[item.key]}
                </span>
                {route === item.route && (
                  <motion.span
                    layoutId="nav-active"
                    aria-hidden="true"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute -bottom-1.5 left-0 h-px w-full bg-ember"
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button
              type="button"
              onClick={() => onNavigate("settings")}
              aria-label={t.nav.settings}
              aria-current={route === "settings" ? "page" : undefined}
              className={`hidden h-9 w-9 items-center justify-center border transition-colors sm:inline-flex ${
                route === "settings"
                  ? "border-navy/40 text-ink"
                  : "border-line/80 text-muted-strong hover:border-navy/30 hover:text-ink"
              }`}
            >
              <SlidersHorizontal size={14} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t.nav.openMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="inline-flex h-9 w-9 items-center justify-center border border-line/80 text-navy transition-colors hover:border-navy/30 lg:hidden"
            >
              <Menu size={17} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-[70] flex flex-col bg-mist lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex h-16 items-center justify-between border-b border-line/70 px-5">
              <span className="font-display text-[12px] uppercase tracking-[0.24em] text-ink">
                Beyond Time
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={t.nav.closeMenu}
                className="inline-flex h-9 w-9 items-center justify-center border border-line text-navy"
              >
                <X size={17} strokeWidth={1.5} />
              </button>
            </div>

            <nav
              aria-label={t.nav.primary}
              className="flex flex-1 flex-col justify-center gap-1 px-6 py-10"
            >
              {order.map((item, index) => (
                <motion.button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.05, duration: 0.4 }}
                  aria-current={route === item.route ? "page" : undefined}
                  className="group flex items-center justify-between border-b border-line/60 py-4 text-left"
                >
                  <span className="flex items-baseline gap-4">
                    <span
                      className={`font-mono text-[10px] ${
                        route === item.route ? "text-ember" : "text-muted-strong"
                      }`}
                    >
                      0{index + 1}
                    </span>
                    <span
                      className={`font-display text-2xl font-light ${
                        route === item.route ? "text-ink" : "text-navy/80"
                      }`}
                    >
                      {t.nav[item.key]}
                    </span>
                  </span>
                  <ArrowUpRight
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="text-muted-strong transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </motion.button>
              ))}
            </nav>

            <div className="flex items-center justify-between gap-4 border-t border-line/70 px-6 py-5">
              <LanguageSelector />
              <button
                type="button"
                onClick={() => onNavigate("settings")}
                className="btn-quiet"
              >
                <SlidersHorizontal size={13} strokeWidth={1.5} />
                {t.nav.settings}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

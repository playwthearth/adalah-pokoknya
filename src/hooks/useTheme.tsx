import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { storageKeys } from "../data/site";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** What the person chose, including "system". */
  preference: ThemePreference;
  /** What is actually painted right now. */
  theme: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: "#f4f7fa",
  dark: "#111b25",
};

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(storageKeys.theme);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // Storage may be blocked; the system preference still applies.
  }
  return "system";
}

function resolve(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? systemTheme() : preference;
}

/**
 * Paints the theme on <html data-theme> and keeps the mobile browser chrome in
 * step. The first paint is handled by the inline script in index.html, so this
 * provider never causes a flash — it only keeps things in sync afterwards.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredTheme);
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolve(readStoredTheme()));

  useEffect(() => {
    const apply = () => setTheme(resolve(preference));
    apply();

    if (preference !== "system" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [preference]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
  }, [theme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(storageKeys.theme, next);
    } catch {
      // The choice still applies for this session.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, theme, setPreference }),
    [preference, theme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

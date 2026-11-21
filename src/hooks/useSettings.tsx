import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { site, storageKeys } from "../data/site";
import { clamp, isValidISODate } from "../utils/format";

export interface Settings {
  recipient: string;
  author: string;
  /** ISO date the relationship began. */
  startDate: string;
  /** Player volume, 0–1. */
  volume: number;
}

const defaults: Settings = {
  recipient: site.names.recipient,
  author: site.names.author,
  startDate: site.startDate,
  volume: 0.6,
};

interface SettingsContextValue {
  settings: Settings;
  update: (partial: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function sanitize(input: Partial<Settings>): Settings {
  return {
    recipient:
      typeof input.recipient === "string" ? input.recipient.slice(0, 40) : defaults.recipient,
    author: typeof input.author === "string" ? input.author.slice(0, 40) : defaults.author,
    startDate:
      typeof input.startDate === "string" && isValidISODate(input.startDate)
        ? input.startDate
        : defaults.startDate,
    volume: typeof input.volume === "number" ? clamp(input.volume) : defaults.volume,
  };
}

function readStoredSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(storageKeys.settings);
    if (!raw) return defaults;
    return sanitize(JSON.parse(raw) as Partial<Settings>);
  } catch {
    return defaults;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(readStoredSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKeys.settings, JSON.stringify(settings));
    } catch {
      // Storage may be blocked; the session still works.
    }
  }, [settings]);

  const update = useCallback((partial: Partial<Settings>) => {
    setSettings((current) => sanitize({ ...current, ...partial }));
  }, []);

  const reset = useCallback(() => setSettings(defaults), []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, update, reset }),
    [settings, update, reset],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used inside SettingsProvider");
  return context;
}

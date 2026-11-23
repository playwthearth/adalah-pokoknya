import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { site, storageKeys } from "../data/site";
import { supabase } from "../lib/supabase";
import { clamp, isValidISODate } from "../utils/format";
import { useAuth } from "./useAuth";

export interface Settings {
  recipient: string;
  author: string;
  /** ISO date the relationship began. */
  startDate: string;
  /** Player volume, 0–1. */
  volume: number;
}

/** The fields both people see the same value for. */
type SharedSettings = Pick<Settings, "recipient" | "author" | "startDate">;

const sharedDefaults: SharedSettings = {
  recipient: site.names.recipient,
  author: site.names.author,
  startDate: site.startDate,
};

const defaultVolume = 0.6;

/** Both people read and write the same row. */
const ROW_ID = "shared";

interface SettingsContextValue {
  settings: Settings;
  update: (partial: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function sanitizeShared(input: Partial<SharedSettings>): SharedSettings {
  return {
    recipient:
      typeof input.recipient === "string" ? input.recipient.slice(0, 40) : sharedDefaults.recipient,
    author: typeof input.author === "string" ? input.author.slice(0, 40) : sharedDefaults.author,
    startDate:
      typeof input.startDate === "string" && isValidISODate(input.startDate)
        ? input.startDate
        : sharedDefaults.startDate,
  };
}

interface SettingsRow {
  recipient: string | null;
  author: string | null;
  start_date: string | null;
}

/** Volume is a device preference, so it stays in localStorage. */
function readLocalVolume(): number {
  try {
    const raw = window.localStorage.getItem(storageKeys.volume);
    const value = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(value) ? clamp(value) : defaultVolume;
  } catch {
    return defaultVolume;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [shared, setShared] = useState<SharedSettings>(sharedDefaults);
  const [volume, setVolume] = useState(readLocalVolume);

  // Latest shared values, so a debounced save posts what is on screen.
  const sharedRef = useRef(shared);
  sharedRef.current = shared;
  const saveTimer = useRef<number | null>(null);
  // A local edit must win over a read that was already in flight.
  const editing = useRef(false);

  const saveShared = useCallback(
    async (values?: SharedSettings) => {
      if (!supabase || !userId) return;
      const { error } = await supabase.from("settings").upsert(
        {
          id: ROW_ID,
          ...(values ?? sharedRef.current),
          updated_at: new Date().toISOString(),
          updated_by: userId,
        },
        { onConflict: "id" },
      );
      if (error) {
        console.error("[settings] save failed", error);
        return;
      }
      editing.current = false;
    },
    [userId],
  );

  useEffect(() => {
    // The old cache held per-device names and a stale anniversary; the shared
    // row replaces it, so drop it rather than let it resurface.
    try {
      window.localStorage.removeItem(storageKeys.legacySettings);
    } catch {
      // Storage may be blocked; nothing to clean up.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKeys.volume, String(volume));
    } catch {
      // Storage may be blocked; the session still works.
    }
  }, [volume]);

  useEffect(() => {
    editing.current = false;
    const client = supabase;
    if (!client || !userId) return;
    let alive = true;

    const load = async () => {
      const { data, error } = await client
        .from("settings")
        .select("recipient, author, start_date")
        .eq("id", ROW_ID)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        console.error("[settings] load failed", error);
        return;
      }

      if (!data) {
        // First run: create the row so both people share one source of truth.
        void saveShared();
        return;
      }

      if (editing.current) return;

      const row = data as SettingsRow;
      setShared(
        sanitizeShared({
          recipient: row.recipient ?? undefined,
          author: row.author ?? undefined,
          startDate: row.start_date ?? undefined,
        }),
      );
    };

    void load();

    // Re-read when the tab comes back to the front, so her change shows up
    // without a reload.
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, saveShared]);

  useEffect(
    () => () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    },
    [],
  );

  const update = useCallback(
    (partial: Partial<Settings>) => {
      if (typeof partial.volume === "number") setVolume(clamp(partial.volume));

      const touchesShared =
        "recipient" in partial || "author" in partial || "startDate" in partial;
      if (!touchesShared) return;

      setShared((current) => sanitizeShared({ ...current, ...partial }));
      editing.current = true;

      // Debounced: typing a name should not send one request per keystroke.
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        saveTimer.current = null;
        void saveShared();
      }, 600);
    },
    [saveShared],
  );

  const reset = useCallback(() => {
    setVolume(defaultVolume);
    setShared(sharedDefaults);
    editing.current = true;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    void saveShared(sharedDefaults);
  }, [saveShared]);

  const settings = useMemo<Settings>(() => ({ ...shared, volume }), [shared, volume]);

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

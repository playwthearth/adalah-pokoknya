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
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { useNotes } from "./useNotes";

/**
 * The two places content is added at runtime. Letters are written into the
 * code, so they never arrive while someone is looking.
 */
export type NotificationKind = "notes" | "memories";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  /** The name the note was signed with; memories do not carry one. */
  author: string;
  /** The note's opening words, or the memory's title. */
  text: string;
  createdAt: string;
}

interface NotificationsValue {
  items: NotificationItem[];
  unread: number;
  /** Called when the reader opens the room a kind lives in. */
  markSeen: (kind: NotificationKind) => void;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

const MEMORY_COLUMNS = "id, title, created_at, created_by";
const MEMORY_LIMIT = 40;
/** Safety net under realtime, the same rhythm the archive uses. */
const POLL_MS = 60000;
/** How much of a note the list shows before it trails off. */
const SNIPPET = 90;

interface MemoryMark {
  id: string;
  title: string | null;
  created_at: string;
  created_by: string | null;
}

function seenKey(kind: NotificationKind): string {
  return kind === "notes" ? storageKeys.seenNotes : storageKeys.seenMemories;
}

function readSeen(kind: NotificationKind): string | null {
  try {
    return window.localStorage.getItem(seenKey(kind));
  } catch {
    return null;
  }
}

function writeSeen(kind: NotificationKind, iso: string) {
  try {
    window.localStorage.setItem(seenKey(kind), iso);
  } catch {
    // A blocked store only costs the badge, never the content.
  }
}

/** The newest timestamp in a list, so comparisons never depend on the clock. */
function newestOf(rows: { created_at: string }[]): string | null {
  return rows.reduce<string | null>(
    (newest, row) => (!newest || row.created_at > newest ? row.created_at : newest),
    null,
  );
}

/**
 * What the other person has added since this device last looked.
 *
 * Nothing new is stored: both tables already carry `created_at` and the author,
 * so the unread list is read straight off the archive and the last-seen moment
 * lives in localStorage. A first visit records where "now" is instead of
 * announcing everything that came before it.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const { notes } = useNotes();
  const [memories, setMemories] = useState<MemoryMark[]>([]);
  const [seen, setSeen] = useState<Record<NotificationKind, string | null>>(() => ({
    notes: readSeen("notes"),
    memories: readSeen("memories"),
  }));

  const loadMemories = useCallback(async () => {
    const client = supabase;
    if (!client || !userId) return;
    const { data, error } = await client
      .from("memories")
      .select(MEMORY_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(MEMORY_LIMIT);
    if (error) {
      console.error("[notifications] memories read failed", error);
      return;
    }
    setMemories((data ?? []) as MemoryMark[]);
  }, [userId]);

  useEffect(() => {
    void loadMemories();
  }, [loadMemories]);

  // A memory added while the page is open should reach the bell on its own.
  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return;

    const channel = client
      .channel(`notifications-live-${Math.random().toString(36).slice(2, 10)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "memories" },
        (payload) => {
          const incoming = payload.new as MemoryMark;
          setMemories((current) =>
            [incoming, ...current.filter((memory) => memory.id !== incoming.id)].slice(
              0,
              MEMORY_LIMIT,
            ),
          );
        },
      )
      .subscribe();

    const tick = () => {
      if (document.visibilityState === "visible") void loadMemories();
    };
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      void client.removeChannel(channel);
    };
  }, [userId, loadMemories]);

  const items = useMemo<NotificationItem[]>(() => {
    const noteItems: NotificationItem[] = notes
      .filter((note) => note.author_id !== userId)
      .filter((note) => !seen.notes || note.created_at > seen.notes)
      .map((note) => ({
        id: `note-${note.id}`,
        kind: "notes" as const,
        author: note.author_name,
        text:
          note.body.length > SNIPPET ? `${note.body.slice(0, SNIPPET).trimEnd()}…` : note.body,
        createdAt: note.created_at,
      }));

    const memoryItems: NotificationItem[] = memories
      .filter((memory) => memory.created_by !== userId)
      .filter((memory) => !seen.memories || memory.created_at > seen.memories)
      .map((memory) => ({
        id: `memory-${memory.id}`,
        kind: "memories" as const,
        author: "",
        text: memory.title ?? "",
        createdAt: memory.created_at,
      }));

    return [...noteItems, ...memoryItems].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }, [notes, memories, seen.notes, seen.memories, userId]);

  /**
   * The first read of a list sets the mark rather than raising it: an empty
   * badge on the first visit beats forty notifications for the whole archive.
   */
  useEffect(() => {
    if (seen.notes !== null || notes.length === 0) return;
    const newest = newestOf(notes);
    if (!newest) return;
    writeSeen("notes", newest);
    setSeen((current) => ({ ...current, notes: newest }));
  }, [notes, seen.notes]);

  useEffect(() => {
    if (seen.memories !== null || memories.length === 0) return;
    const newest = newestOf(memories);
    if (!newest) return;
    writeSeen("memories", newest);
    setSeen((current) => ({ ...current, memories: newest }));
  }, [memories, seen.memories]);

  const markSeen = useCallback(
    (kind: NotificationKind) => {
      const newest = kind === "notes" ? newestOf(notes) : newestOf(memories);
      if (!newest) return;
      writeSeen(kind, newest);
      setSeen((current) => (current[kind] === newest ? current : { ...current, [kind]: newest }));
    },
    [notes, memories],
  );

  const value = useMemo<NotificationsValue>(
    () => ({
      items,
      unread: items.length,
      markSeen,
    }),
    [items, markSeen],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsValue {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationsProvider");
  return context;
}

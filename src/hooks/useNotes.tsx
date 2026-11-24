import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { Note, NoteKind } from "../types";
import { useAuth } from "./useAuth";

interface NewNote {
  kind: NoteKind;
  body: string;
  authorName: string;
}

interface NotesContextValue {
  notes: Note[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  addNote: (note: NewNote) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextValue | null>(null);

const NOTE_COLUMNS = "id, author_id, author_email, author_name, kind, body, created_at";
const NOTE_LIMIT = 60;
/**
 * Safety net under realtime: if the notes table is not published for realtime,
 * or the socket drops, a quiet read still brings the other person's note in
 * while the tab is on screen. Never runs in the background.
 */
const POLL_MS = 10000;
/** Daily notes live for one day; love messages are kept for good. */
const DAY_MS = 24 * 60 * 60 * 1000;
/** How often a note that just turned a day old is taken off the screen. */
const PRUNE_MS = 60000;

function withinDay(note: Note, now = Date.now()): boolean {
  if (note.kind !== "daily") return true;
  const created = new Date(note.created_at).getTime();
  return Number.isFinite(created) && now - created < DAY_MS;
}

/** PostgREST filter: love notes always, daily notes only from the last day. */
function freshFilter(): string {
  const cutoff = new Date(Date.now() - DAY_MS).toISOString().replace(/\.\d+Z$/, "Z");
  return `kind.eq.love,created_at.gt.${cutoff}`;
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const { userId, email } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /**
   * `silent` reads happen in the background: they must not flash the skeleton
   * or replace a note that arrived while the request was in flight.
   */
  const load = useCallback(async (silent: boolean) => {
    const client = supabase;
    if (!client) return;

    if (!silent) {
      setLoading(true);
      setError(false);
    }

    const { data, error: failure } = await client
      .from("notes")
      .select(NOTE_COLUMNS)
      .or(freshFilter())
      .order("created_at", { ascending: false })
      .limit(NOTE_LIMIT);

    if (failure) {
      if (!silent) {
        setError(true);
        setLoading(false);
      }
      return;
    }

    const rows = ((data ?? []) as Note[]).filter((note) => withinDay(note));
    setNotes((current) => {
      if (!silent) return rows;
      // A note saved while this read was running is newer than anything the
      // read returned, so keep it instead of blinking it away.
      const horizon = rows[0]?.created_at ?? "";
      const fresh = current.filter(
        (note) => note.created_at > horizon && !rows.some((row) => row.id === note.id),
      );
      return fresh.length > 0 ? [...fresh, ...rows] : rows;
    });

    if (!silent) setLoading(false);

    // Reclaim the rows behind notes that already faded, so the table does not
    // keep growing with notes nobody can see.
    if (!silent) {
      void client.rpc("purge_expired_daily_notes").then(({ error: purgeError }) => {
        if (purgeError) console.error("[notes] purge failed", purgeError);
      });
    }
  }, []);

  const refresh = useCallback(() => load(false), [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A note that turns a day old while the page is open should not wait for the
  // next read to leave the list.
  useEffect(() => {
    const prune = () => {
      setNotes((current) => {
        const next = current.filter((note) => withinDay(note));
        return next.length === current.length ? current : next;
      });
    };
    const timer = window.setInterval(prune, PRUNE_MS);
    return () => window.clearInterval(timer);
  }, []);

  // Both people are usually looking at the same page: a note the other one
  // leaves should appear on its own, without a reload.
  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return;

    const channel = client
      .channel("notes-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes" },
        (payload) => {
          const incoming = payload.new as Note;
          if (!withinDay(incoming)) return;
          setNotes((current) => {
            if (current.some((note) => note.id === incoming.id)) return current;
            return [incoming, ...current]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .slice(0, NOTE_LIMIT);
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notes" },
        (payload) => {
          const removed = (payload.old as { id?: string }).id;
          if (removed) setNotes((current) => current.filter((note) => note.id !== removed));
        },
      )
      .subscribe();

    const tick = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      void client.removeChannel(channel);
    };
  }, [userId, load]);

  const addNote = useCallback(
    async ({ kind, body, authorName }: NewNote) => {
      if (!supabase || !userId) throw new Error("not signed in");
      const { data, error: failure } = await supabase
        .from("notes")
        .insert({
          author_id: userId,
          author_email: email,
          author_name: authorName.slice(0, 40) || "—",
          kind,
          body: body.trim(),
        })
        .select(NOTE_COLUMNS)
        .single();

      if (failure) throw failure;
      const saved = data as Note;
      // The realtime echo of this insert is deduplicated by id.
      setNotes((current) =>
        current.some((note) => note.id === saved.id)
          ? current
          : [saved, ...current].slice(0, NOTE_LIMIT),
      );
    },
    [userId, email],
  );

  const removeNote = useCallback(async (id: string) => {
    if (!supabase) return;
    const { error: failure } = await supabase.from("notes").delete().eq("id", id);
    if (failure) throw failure;
    setNotes((current) => current.filter((note) => note.id !== id));
  }, []);

  const value = useMemo<NotesContextValue>(
    () => ({ notes, loading, error, refresh, addNote, removeNote }),
    [notes, loading, error, refresh, addNote, removeNote],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const context = useContext(NotesContext);
  if (!context) throw new Error("useNotes must be used inside NotesProvider");
  return context;
}

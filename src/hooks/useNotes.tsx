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
import { zonedDateKey } from "../utils/format";
import { useAuth } from "./useAuth";
import { useSettings } from "./useSettings";

interface NewNote {
  kind: NoteKind;
  body: string;
  authorName: string;
}

interface NotesContextValue {
  notes: Note[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  addNote: (note: NewNote) => Promise<void>;
  updateNote: (id: string, note: NewNote) => Promise<void>;
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
const POLL_MS = 30000;
/**
 * A daily note belongs to the day it was written and goes when that day ends
 * in the shared zone. Love messages are kept for good.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
/** Two days of slack so any zone's date rollover is covered by the read. */
const READ_BACK_MS = 2 * DAY_MS;
/** How often a note whose day has ended is taken off the screen. */
const PRUNE_MS = 60000;

function onTheSameDay(iso: string, now: number, timeZone: string): boolean {
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return false;
  return zonedDateKey(created, timeZone) === zonedDateKey(new Date(now), timeZone);
}

function currentDaily(note: Note, timeZone: string, now = Date.now()): boolean {
  if (note.kind !== "daily") return true;
  return onTheSameDay(note.created_at, now, timeZone);
}

/** PostgREST filter: love notes always, daily notes from the last two days. */
function freshFilter(now = Date.now()): string {
  const cutoff = new Date(now - READ_BACK_MS).toISOString().replace(/\.\d+Z$/, "Z");
  return `kind.eq.love,created_at.gt.${cutoff}`;
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const { userId, email } = useAuth();
  const { settings } = useSettings();
  const timeZone = settings.timezone;
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [limit, setLimit] = useState(NOTE_LIMIT);
  const [error, setError] = useState(false);

  /**
   * `silent` reads happen in the background: they must not flash the skeleton
   * or replace a note that arrived while the request was in flight.
   */
  const load = useCallback(async (silent: boolean, fetchLimit = limit) => {
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
      .limit(fetchLimit);

    if (failure) {
      if (!silent) {
        setError(true);
        setLoading(false);
      }
      return;
    }

    const rawRows = (data ?? []) as Note[];
    setHasMore(rawRows.length >= fetchLimit);
    const rows = rawRows.filter((note) => currentDaily(note, timeZone));
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
  }, [timeZone, limit]);

  const refresh = useCallback(() => load(false), [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A note whose day ends while the page is open should not wait for the next
  // read to leave the list.
  useEffect(() => {
    const prune = () => {
      setNotes((current) => {
        const next = current.filter((note) => currentDaily(note, timeZone));
        return next.length === current.length ? current : next;
      });
    };
    const timer = window.setInterval(prune, PRUNE_MS);
    return () => window.clearInterval(timer);
  }, [timeZone]);

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
          if (!currentDaily(incoming, timeZone)) return;
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
        { event: "UPDATE", schema: "public", table: "notes" },
        (payload) => {
          const updated = payload.new as Note;
          setNotes((current) =>
            current.map((note) => (note.id === updated.id ? updated : note)),
          );
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
  }, [userId, load, timeZone]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextLimit = limit + 30;
    setLimit(nextLimit);
    try {
      await load(true, nextLimit);
    } finally {
      setLoadingMore(false);
    }
  }, [limit, loadingMore, hasMore, load]);

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
          : [saved, ...current].slice(0, limit),
      );
    },
    [userId, email, limit],
  );

  const updateNote = useCallback(
    async (id: string, { kind, body, authorName }: NewNote) => {
      if (!supabase || !userId) throw new Error("not signed in");

      // 1. Attempt in-place update first
      const { data, error: failure } = await supabase
        .from("notes")
        .update({
          kind,
          body: body.trim(),
          author_name: authorName.slice(0, 40) || "—",
        })
        .eq("id", id)
        .eq("author_id", userId)
        .select(NOTE_COLUMNS)
        .single();

      if (!failure && data) {
        const updated = data as Note;
        setNotes((current) =>
          current.map((note) => (note.id === id ? updated : note)),
        );
        return;
      }

      // 2. In-place update is refused when the table has no UPDATE grant or
      //    policy yet (see supabase/schema.sql: notes_update). Fall back to a
      //    replace — but write the new row first and only then remove the old
      //    one, so a failed request can never leave the note missing. The note
      //    keeps its text; only its id and created_at are renewed.
      const insertRes = await supabase
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

      if (insertRes.error) throw insertRes.error;
      const reinserted = insertRes.data as Note;

      const deleteRes = await supabase
        .from("notes")
        .delete()
        .eq("id", id)
        .eq("author_id", userId);

      if (deleteRes.error) {
        // Undo the copy so the list does not show the note twice, then report.
        await supabase.from("notes").delete().eq("id", reinserted.id).eq("author_id", userId);
        throw deleteRes.error;
      }

      setNotes((current) =>
        current.map((note) => (note.id === id ? reinserted : note)),
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
    () => ({
      notes,
      loading,
      loadingMore,
      hasMore,
      error,
      refresh,
      loadMore,
      addNote,
      updateNote,
      removeNote,
    }),
    [
      notes,
      loading,
      loadingMore,
      hasMore,
      error,
      refresh,
      loadMore,
      addNote,
      updateNote,
      removeNote,
    ],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const context = useContext(NotesContext);
  if (!context) throw new Error("useNotes must be used inside NotesProvider");
  return context;
}

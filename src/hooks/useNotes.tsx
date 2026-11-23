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

export function NotesProvider({ children }: { children: ReactNode }) {
  const { userId, email } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(false);
    const { data, error: failure } = await supabase
      .from("notes")
      .select("id, author_id, author_email, author_name, kind, body, created_at")
      .order("created_at", { ascending: false })
      .limit(60);

    if (failure) {
      setError(true);
      setLoading(false);
      return;
    }

    setNotes((data ?? []) as Note[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
        .select("id, author_id, author_email, author_name, kind, body, created_at")
        .single();

      if (failure) throw failure;
      setNotes((current) => [data as Note, ...current]);
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

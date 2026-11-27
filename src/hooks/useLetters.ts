import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Language, Letter, LetterCategory, Localized } from "../types";
import { useAuth } from "./useAuth";

/**
 * Letters written in the app, on top of the ones kept in `src/data/letters.ts`.
 * Both members read the same list, so a letter the other person writes appears
 * on its own.
 */
const POLL_MS = 60000;

export interface LetterDraft {
  title: string;
  body: string;
  category: LetterCategory;
  /** ISO date, e.g. "2026-11-27". */
  date: string;
  /**
   * The language it was written in. The words are kept exactly as typed and
   * stand in for every language, rather than inventing translations.
   */
  language: Language;
}

interface LetterRow {
  id: string;
  title: string;
  body: string;
  category: LetterCategory;
  letter_date: string;
  language: Language;
  created_by: string | null;
}

const COLUMNS = "id, title, body, category, letter_date, language, created_by";

function inEveryLanguage(text: string): Localized {
  return { en: text, id: text, ja: text };
}

function toLetter(row: LetterRow): Letter {
  return {
    id: row.id,
    title: inEveryLanguage(row.title),
    content: inEveryLanguage(row.body),
    category: row.category,
    date: row.letter_date,
    added: true,
    authorId: row.created_by,
  };
}

export interface LettersValue {
  added: Letter[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  addLetter: (draft: LetterDraft) => Promise<void>;
  deleteLetter: (id: string) => Promise<void>;
}

export function useLetters(): LettersValue {
  const { userId } = useAuth();
  const [added, setAdded] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  /** Bumped by every local change and realtime event, so a slow read cannot undo one. */
  const changes = useRef(0);

  const load = useCallback(async (silent: boolean) => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
      setError(false);
    }

    const before = changes.current;
    const { data, error: failure } = await client
      .from("letters")
      .select(COLUMNS)
      .order("letter_date", { ascending: false })
      .limit(200);

    if (failure) {
      console.error("[letters] load failed", failure);
      if (!silent) {
        setError(true);
        setLoading(false);
      }
      return;
    }

    if (silent && changes.current !== before) return;
    setAdded((data ?? []).map((row) => toLetter(row as LetterRow)));
    if (!silent) setLoading(false);
  }, []);

  const refresh = useCallback(() => load(false), [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A letter the other person writes or removes should land without a reload.
  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return;

    const keep = (letter: Letter) => {
      changes.current += 1;
      setAdded((current) =>
        current.some((item) => item.id === letter.id)
          ? current
          : [letter, ...current].sort((a, b) => b.date.localeCompare(a.date)),
      );
    };

    const channel = client
      .channel(`letters-live-${Math.random().toString(36).slice(2, 10)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "letters" },
        (payload) => keep(toLetter(payload.new as LetterRow)),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "letters" },
        (payload) => {
          const removed = (payload.old as { id?: string }).id;
          if (!removed) return;
          changes.current += 1;
          setAdded((current) => current.filter((item) => item.id !== removed));
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

  const addLetter = useCallback(
    async (draft: LetterDraft) => {
      const client = supabase;
      if (!client || !userId) throw new Error("not signed in");

      const { data, error: failure } = await client
        .from("letters")
        .insert({
          title: draft.title.trim(),
          body: draft.body.trim(),
          category: draft.category,
          letter_date: draft.date,
          language: draft.language,
          created_by: userId,
        })
        .select(COLUMNS)
        .single();

      if (failure) throw failure;

      const saved = toLetter(data as LetterRow);
      changes.current += 1;
      // The realtime echo of this insert is deduplicated by id.
      setAdded((current) =>
        current.some((item) => item.id === saved.id)
          ? current
          : [saved, ...current].sort((a, b) => b.date.localeCompare(a.date)),
      );
    },
    [userId],
  );

  const deleteLetter = useCallback(async (id: string) => {
    const client = supabase;
    if (!client) throw new Error("not configured");

    const { error: failure } = await client.from("letters").delete().eq("id", id);
    if (failure) throw failure;

    changes.current += 1;
    setAdded((current) => current.filter((item) => item.id !== id));
  }, []);

  return { added, loading, error, refresh, addLetter, deleteLetter };
}

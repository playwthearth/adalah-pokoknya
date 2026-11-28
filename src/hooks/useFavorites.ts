import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

/**
 * A bookmark, not an edit: the letter itself never changes, and each member
 * keeps their own shelf. The row is `(user_id, letter_id)` in
 * `public.letter_favorites`, and Row Level Security only ever hands back the
 * signed-in member's own rows.
 */
const TABLE = "letter_favorites";

export interface FavoritesValue {
  ids: Set<string>;
  loading: boolean;
  error: boolean;
  isFavorite: (id: string) => boolean;
  /** Adds or removes a bookmark, undoing the change if the write fails. */
  toggle: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFavorites(): FavoritesValue {
  const { userId } = useAuth();
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  /** The latest set, so a quick second tap reads what is on screen. */
  const idsRef = useRef<Set<string>>(new Set());
  /** One write per letter at a time. */
  const pending = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    const client = supabase;
    if (!client || !userId) {
      const empty = new Set<string>();
      idsRef.current = empty;
      setIds(empty);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    const { data, error: failure } = await client
      .from(TABLE)
      .select("letter_id")
      .eq("user_id", userId);

    if (failure) {
      console.error("[letters] favorites load failed", failure);
      setError(true);
      setLoading(false);
      return;
    }

    const next = new Set(
      (data ?? []).map((row) => (row as { letter_id: string }).letter_id),
    );
    idsRef.current = next;
    setIds(next);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(
    async (id: string) => {
      const client = supabase;
      if (!client || !userId) {
        setError(true);
        return;
      }
      if (pending.current.has(id)) return;
      pending.current.add(id);

      const wasFavorite = idsRef.current.has(id);
      const optimistic = new Set(idsRef.current);
      if (wasFavorite) optimistic.delete(id);
      else optimistic.add(id);
      idsRef.current = optimistic;
      setIds(optimistic);
      setError(false);

      const { error: failure } = wasFavorite
        ? await client.from(TABLE).delete().eq("user_id", userId).eq("letter_id", id)
        : await client.from(TABLE).insert({ user_id: userId, letter_id: id });

      if (failure) {
        console.error("[letters] favorite failed", failure);
        // Put the shelf back the way it was before the failed write.
        const reverted = new Set(idsRef.current);
        if (wasFavorite) reverted.add(id);
        else reverted.delete(id);
        idsRef.current = reverted;
        setIds(reverted);
        setError(true);
      }

      pending.current.delete(id);
    },
    [userId],
  );

  const isFavorite = useCallback((id: string) => ids.has(id), [ids]);

  return { ids, loading, error, isFavorite, toggle, refresh: load };
}

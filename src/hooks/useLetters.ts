import { useCallback, useEffect, useRef, useState } from "react";
import { readDecor } from "../data/letterDecor";
import { supabase } from "../lib/supabase";
import type { Language, Letter, LetterCategory, LetterDecor, Localized } from "../types";
import { photoExtension } from "../utils/image";
import { useAuth } from "./useAuth";

/**
 * Letters written in the app, on top of the ones kept in `src/data/letters.ts`.
 * Both members read the same list, so a letter the other person writes appears
 * on its own.
 */
const POLL_MS = 60000;
/**
 * Letter photos use the same private bucket as the archive: members may read
 * every photo, and each upload lands in its writer's own folder.
 */
const BUCKET = "memories";
const SIGNED_URL_TTL = 60 * 60 * 2;
/** Re-sign a photo well before its two-hour link lapses. */
const SIGN_REFRESH_MS = 90 * 60 * 1000;

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
  /** A photo chosen from the device, a drive or the camera, if any. */
  photo: File | null;
  /** True when the letter already had a photo and it should be taken away. */
  removePhoto: boolean;
  /** Stamps, stickers and internet pieces pinned to the letter. */
  decor: LetterDecor[];
}

interface LetterRow {
  id: string;
  title: string;
  body: string;
  category: LetterCategory;
  letter_date: string;
  language: Language;
  image_path: string | null;
  decor: unknown;
  created_by: string | null;
}

const COLUMNS =
  "id, title, body, category, letter_date, language, image_path, decor, created_by";

/** Signed links, so polling cannot make the same photo download again. */
type SignedCache = Map<string, { url: string; expires: number }>;

function inEveryLanguage(text: string): Localized {
  return { en: text, id: text, ja: text };
}

function toLetter(row: LetterRow, image: string | null): Letter {
  return {
    id: row.id,
    title: inEveryLanguage(row.title),
    content: inEveryLanguage(row.body),
    category: row.category,
    date: row.letter_date,
    added: true,
    authorId: row.created_by,
    image,
    imagePath: row.image_path,
    decor: readDecor(row.decor),
  };
}

/** Turns rows into letters, signing the private photo links. */
async function withPhotos(
  client: NonNullable<typeof supabase>,
  rows: LetterRow[],
  cache: SignedCache,
): Promise<Letter[]> {
  const paths = [
    ...new Set(rows.map((row) => row.image_path).filter((path): path is string => Boolean(path))),
  ];
  const now = Date.now();
  const stale = paths.filter((path) => {
    const hit = cache.get(path);
    return !hit || hit.expires <= now;
  });

  if (stale.length > 0) {
    const { data } = await client.storage.from(BUCKET).createSignedUrls(stale, SIGNED_URL_TTL);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) {
        cache.set(item.path, { url: item.signedUrl, expires: now + SIGN_REFRESH_MS });
      }
    }
  }

  return rows.map((row) =>
    toLetter(row, row.image_path ? (cache.get(row.image_path)?.url ?? null) : null),
  );
}

function newestFirst(current: Letter[], letter: Letter): Letter[] {
  const next = current.some((item) => item.id === letter.id)
    ? current.map((item) => (item.id === letter.id ? letter : item))
    : [letter, ...current];
  return next.sort((a, b) => b.date.localeCompare(a.date));
}

export interface LettersValue {
  added: Letter[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  addLetter: (draft: LetterDraft) => Promise<void>;
  editLetter: (id: string, draft: LetterDraft) => Promise<void>;
  deleteLetter: (id: string) => Promise<void>;
}

export function useLetters(): LettersValue {
  const { userId } = useAuth();
  const [added, setAdded] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  /** Bumped by every local change and realtime event, so a slow read cannot undo one. */
  const changes = useRef(0);
  const signed = useRef<SignedCache>(new Map());

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

    const next = await withPhotos(client, (data ?? []) as LetterRow[], signed.current);
    setAdded(next);
    if (!silent) setLoading(false);
  }, []);

  const refresh = useCallback(() => load(false), [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A letter the other person writes, changes or removes should land without a reload.
  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return;

    const applyRow = (row: LetterRow) => {
      void withPhotos(client, [row], signed.current).then(([letter]) => {
        if (!letter) return;
        changes.current += 1;
        setAdded((current) => newestFirst(current, letter));
      });
    };

    const channel = client
      .channel(`letters-live-${Math.random().toString(36).slice(2, 10)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "letters" }, (payload) =>
        applyRow(payload.new as LetterRow),
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "letters" }, (payload) =>
        applyRow(payload.new as LetterRow),
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

  const uploadPhoto = useCallback(
    async (file: File): Promise<string> => {
      const client = supabase;
      if (!client || !userId) throw new Error("not signed in");

      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${photoExtension(file)}`;
      const path = `${userId}/letters/${name}`;
      const { error: failure } = await client.storage.from(BUCKET).upload(path, file, {
        cacheControl: "86400",
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (failure) throw failure;
      return path;
    },
    [userId],
  );

  const addLetter = useCallback(
    async (draft: LetterDraft) => {
      const client = supabase;
      if (!client || !userId) throw new Error("not signed in");

      const path = draft.photo ? await uploadPhoto(draft.photo) : null;
      const { data, error: failure } = await client
        .from("letters")
        .insert({
          title: draft.title.trim(),
          body: draft.body.trim(),
          category: draft.category,
          letter_date: draft.date,
          language: draft.language,
          image_path: path,
          decor: draft.decor,
          created_by: userId,
        })
        .select(COLUMNS)
        .single();

      if (failure) {
        if (path) void client.storage.from(BUCKET).remove([path]);
        throw failure;
      }

      const [saved] = await withPhotos(client, [data as LetterRow], signed.current);
      changes.current += 1;
      // The realtime echo of this insert is deduplicated by id.
      setAdded((current) => newestFirst(current, saved));
    },
    [userId, uploadPhoto],
  );

  const editLetter = useCallback(
    async (id: string, draft: LetterDraft) => {
      const client = supabase;
      if (!client || !userId) throw new Error("not signed in");

      const previous = added.find((letter) => letter.id === id);
      const path = draft.photo ? await uploadPhoto(draft.photo) : null;

      const patch: Record<string, unknown> = {
        title: draft.title.trim(),
        body: draft.body.trim(),
        category: draft.category,
        letter_date: draft.date,
        language: draft.language,
        decor: draft.decor,
      };
      // A new photo replaces the old one; removePhoto clears it outright.
      if (path) patch.image_path = path;
      else if (draft.removePhoto) patch.image_path = null;

      const { data, error: failure } = await client
        .from("letters")
        .update(patch)
        .eq("id", id)
        .select(COLUMNS)
        .single();

      if (failure) {
        if (path) void client.storage.from(BUCKET).remove([path]);
        throw failure;
      }

      // The old object is only cleared once the row points somewhere else.
      if ((path || draft.removePhoto) && previous?.imagePath) {
        void client.storage.from(BUCKET).remove([previous.imagePath]);
      }

      const [saved] = await withPhotos(client, [data as LetterRow], signed.current);
      changes.current += 1;
      setAdded((current) => newestFirst(current, saved));
    },
    [added, userId, uploadPhoto],
  );

  const deleteLetter = useCallback(async (id: string) => {
    const client = supabase;
    if (!client) throw new Error("not configured");

    const { error: failure } = await client.from("letters").delete().eq("id", id);
    if (failure) throw failure;

    changes.current += 1;
    setAdded((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed?.imagePath) void client.storage.from(BUCKET).remove([removed.imagePath]);
      return current.filter((item) => item.id !== id);
    });
  }, []);

  return { added, loading, error, refresh, addLetter, editLetter, deleteLetter };
}

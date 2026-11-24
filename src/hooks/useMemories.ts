import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Memory } from "../types";
import { useAuth } from "./useAuth";

/** Private bucket: photos are read through short-lived signed links. */
const BUCKET = "memories";
const SIGNED_URL_TTL = 60 * 60 * 2;
/** Re-sign a photo well before its two-hour link lapses. */
const SIGN_REFRESH_MS = 90 * 60 * 1000;
/**
 * Safety net under realtime: if the socket drops, a quiet read still brings the
 * other person's change in while the tab is on screen.
 */
const POLL_MS = 10000;

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export interface MemoryDraft {
  title: string;
  note: string;
  /** ISO date, e.g. "2026-08-28". */
  date: string;
  photo: File | null;
}

interface MemoryRow {
  id: string;
  title: string | null;
  note: string | null;
  memory_date: string | null;
  image_path: string | null;
  image_url: string | null;
}

const COLUMNS = "id, title, note, memory_date, image_path, image_url";

/** Signed links, so polling cannot make the same photo download again. */
type SignedCache = Map<string, { url: string; expires: number }>;

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (/^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  const fromType = file.type.split("/")[1]?.toLowerCase() ?? "jpg";
  return fromType === "jpeg" ? "jpg" : fromType;
}

/** Turns rows into displayable memories, signing the private photo links. */
async function withPhotos(
  client: NonNullable<typeof supabase>,
  rows: MemoryRow[],
  cache?: SignedCache,
): Promise<Memory[]> {
  const paths = [...new Set(rows.map((row) => row.image_path).filter((path): path is string => Boolean(path)))];
  const now = Date.now();
  const stale = paths.filter((path) => {
    const hit = cache?.get(path);
    return !hit || hit.expires <= now;
  });

  if (stale.length > 0) {
    const { data } = await client.storage.from(BUCKET).createSignedUrls(stale, SIGNED_URL_TTL);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) {
        cache?.set(item.path, { url: item.signedUrl, expires: now + SIGN_REFRESH_MS });
      }
    }
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title ?? "",
    note: row.note ?? "",
    date: row.memory_date ?? "",
    image:
      (row.image_path ? cache?.get(row.image_path)?.url : null) ?? row.image_url ?? null,
    imagePath: row.image_path,
  }));
}

export interface MemoriesValue {
  memories: Memory[];
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  addMemory: (draft: MemoryDraft) => Promise<void>;
  saveMemory: (id: string, draft: MemoryDraft) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
}

/**
 * The shared memory archive. Both members can add, edit and delete, and photos
 * come from whichever device they are using.
 */
export function useMemories(): MemoriesValue {
  const { userId } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const signed = useRef<SignedCache>(new Map());
  /** Bumped by every local change and every realtime event. */
  const changes = useRef(0);

  /**
   * `silent` reads run in the background: no skeleton, no error flag, and a
   * read that a change overtook is dropped instead of blinking it away.
   */
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
      .from("memories")
      .select(COLUMNS)
      .order("memory_date", { ascending: true });

    if (failure) {
      console.error("[memories] load failed", failure);
      if (!silent) {
        setError(true);
        setLoading(false);
      }
      return;
    }

    if (silent && changes.current !== before) return;

    const next = await withPhotos(client, (data ?? []) as MemoryRow[], signed.current);
    setMemories(next);
    if (!silent) setLoading(false);
  }, []);

  const refresh = useCallback(() => load(false), [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A memory the other person adds or edits should appear on its own.
  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return;

    const applyRow = async (row: MemoryRow) => {
      const [memory] = await withPhotos(client, [row], signed.current);
      changes.current += 1;
      setMemories((current) =>
        [...current.filter((item) => item.id !== memory.id), memory].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      );
    };

    const channel = client
      .channel(`memories-live-${Math.random().toString(36).slice(2, 10)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "memories" },
        (payload) => void applyRow(payload.new as MemoryRow),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "memories" },
        (payload) => void applyRow(payload.new as MemoryRow),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "memories" },
        (payload) => {
          const removed = (payload.old as { id?: string }).id;
          if (!removed) return;
          changes.current += 1;
          setMemories((current) => current.filter((item) => item.id !== removed));
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
      if (!file.type.startsWith("image/")) throw new Error("not an image");
      if (file.size > MAX_PHOTO_BYTES) throw new Error("photo too large");

      const folder = userId;
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionFor(file)}`;
      const path = `${folder}/${name}`;
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

  const addMemory = useCallback(
    async (draft: MemoryDraft) => {
      const client = supabase;
      if (!client || !userId) throw new Error("not signed in");

      const path = draft.photo ? await uploadPhoto(draft.photo) : null;
      const { data, error: failure } = await client
        .from("memories")
        .insert({
          title: draft.title.trim(),
          note: draft.note.trim(),
          memory_date: draft.date,
          image_path: path,
          created_by: userId,
        })
        .select(COLUMNS)
        .single();

      if (failure) {
        if (path) void client.storage.from(BUCKET).remove([path]);
        throw failure;
      }

      const [memory] = await withPhotos(client, [data as MemoryRow], signed.current);
      changes.current += 1;
      // The realtime echo of this insert is deduplicated by id.
      setMemories((current) =>
        [...current.filter((item) => item.id !== memory.id), memory].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      );
    },
    [userId, uploadPhoto],
  );

  const saveMemory = useCallback(
    async (id: string, draft: MemoryDraft) => {
      const client = supabase;
      if (!client || !userId) throw new Error("not signed in");

      const previous = memories.find((memory) => memory.id === id);
      const path = draft.photo ? await uploadPhoto(draft.photo) : null;
      const patch: Record<string, unknown> = {
        title: draft.title.trim(),
        note: draft.note.trim(),
        memory_date: draft.date,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      };
      if (path) patch.image_path = path;

      const { data, error: failure } = await client
        .from("memories")
        .update(patch)
        .eq("id", id)
        .select(COLUMNS)
        .single();

      if (failure) {
        if (path) void client.storage.from(BUCKET).remove([path]);
        throw failure;
      }

      if (path && previous?.imagePath) {
        void client.storage.from(BUCKET).remove([previous.imagePath]);
      }

      const [memory] = await withPhotos(client, [data as MemoryRow], signed.current);
      changes.current += 1;
      setMemories((current) =>
        [...current.filter((item) => item.id !== id), memory].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      );
    },
    [memories, userId, uploadPhoto],
  );

  const deleteMemory = useCallback(
    async (id: string) => {
      const client = supabase;
      if (!client) throw new Error("not configured");

      const { error: failure } = await client.from("memories").delete().eq("id", id);
      if (failure) throw failure;

      const removed = memories.find((memory) => memory.id === id);
      if (removed?.imagePath) {
        void client.storage.from(BUCKET).remove([removed.imagePath]);
      }
      changes.current += 1;
      setMemories((current) => current.filter((memory) => memory.id !== id));
    },
    [memories],
  );

  return { memories, loading, error, refresh, addMemory, saveMemory, deleteMemory };
}

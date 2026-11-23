import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Memory } from "../types";
import { useAuth } from "./useAuth";

/** Private bucket: photos are read through short-lived signed links. */
const BUCKET = "memories";
const SIGNED_URL_TTL = 60 * 60 * 2;

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
): Promise<Memory[]> {
  const paths = rows
    .map((row) => row.image_path)
    .filter((path): path is string => Boolean(path));
  const urls = new Map<string, string>();

  if (paths.length > 0) {
    const { data } = await client.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title ?? "",
    note: row.note ?? "",
    date: row.memory_date ?? "",
    image: (row.image_path ? urls.get(row.image_path) : null) ?? row.image_url ?? null,
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

  const refresh = useCallback(async () => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    const { data, error: failure } = await client
      .from("memories")
      .select(COLUMNS)
      .order("memory_date", { ascending: true });

    if (failure) {
      console.error("[memories] load failed", failure);
      setError(true);
      setLoading(false);
      return;
    }

    setMemories(await withPhotos(client, (data ?? []) as MemoryRow[]));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

      const [memory] = await withPhotos(client, [data as MemoryRow]);
      setMemories((current) =>
        [...current, memory].sort((a, b) => a.date.localeCompare(b.date)),
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

      const [memory] = await withPhotos(client, [data as MemoryRow]);
      setMemories((current) =>
        current
          .map((item) => (item.id === id ? memory : item))
          .sort((a, b) => a.date.localeCompare(b.date)),
      );
    },
    [memories, userId, uploadPhoto],
  );

  const deleteMemory = useCallback(async (id: string) => {
    const client = supabase;
    if (!client) throw new Error("not configured");

    const { error: failure } = await client.from("memories").delete().eq("id", id);
    if (failure) throw failure;

    const removed = memories.find((memory) => memory.id === id);
    if (removed?.imagePath) {
      void client.storage.from(BUCKET).remove([removed.imagePath]);
    }
    setMemories((current) => current.filter((memory) => memory.id !== id));
  }, [memories]);

  return { memories, loading, error, refresh, addMemory, saveMemory, deleteMemory };
}

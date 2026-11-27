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
import { supabase } from "../lib/supabase";
import type { Track } from "../types";
import { useAuth } from "./useAuth";

/** Private bucket: songs are read through signed links, like the photos. */
const BUCKET = "music";
const SIGNED_URL_TTL = 60 * 60 * 6;

export const MAX_TRACK_BYTES = 40 * 1024 * 1024;

/** Everything a browser can usually play, FLAC in Chrome and Safari included. */
const EXTENSIONS = ["mp3", "m4a", "mp4", "aac", "flac", "wav", "ogg", "oga", "opus", "webm"];

const MIME_BY_EXTENSION: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  aac: "audio/aac",
  flac: "audio/flac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  webm: "audio/webm",
};

export function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (EXTENSIONS.includes(fromName)) return fromName;
  const fromType = file.type.split("/")[1]?.toLowerCase() ?? "";
  return EXTENSIONS.includes(fromType) ? fromType : "mp3";
}

/** Windows often hands over an empty MIME for .m4a and .flac; the name decides. */
function mimeFor(file: File): string {
  if (file.type.startsWith("audio/")) return file.type;
  return MIME_BY_EXTENSION[extensionFor(file)] ?? "audio/mpeg";
}

export function isSupportedAudio(file: File): boolean {
  if (file.size > MAX_TRACK_BYTES) return false;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return file.type.startsWith("audio/") || EXTENSIONS.includes(extension);
}

export interface TrackDraft {
  title: string;
  artist: string;
  file: File;
  /** Read from the file before upload; null when the browser could not. */
  duration: number | null;
}

export interface TracksValue {
  /** Songs uploaded by either person, newest last. */
  uploaded: Track[];
  loading: boolean;
  error: boolean;
  addTrack: (draft: TrackDraft) => Promise<Track>;
  removeTrack: (track: Track) => Promise<void>;
}

interface TrackRow {
  id: string;
  title: string | null;
  artist: string | null;
  storage_path: string;
  duration_seconds: number | null;
  created_at: string;
}

const COLUMNS = "id, title, artist, storage_path, duration_seconds, created_at";

const TracksContext = createContext<TracksValue | null>(null);

export function TracksProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [uploaded, setUploaded] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /**
   * Signed links are kept for the visit. A re-read must never hand the player
   * a new link for a song it already holds: the changed `src` would restart
   * it. Only paths that are new get signed.
   */
  const signed = useRef(new Map<string, string>());
  /** One read at a time; a focus during a read is dropped, not queued. */
  const reading = useRef(false);

  const read = useCallback(
    async (silent: boolean) => {
      const client = supabase;
      if (!client || !userId) {
        if (!silent) {
          setUploaded([]);
          setLoading(false);
        }
        return;
      }
      if (reading.current) return;
      reading.current = true;
      if (!silent) {
        setLoading(true);
        setError(false);
      }

      try {
        const { data, error: failure } = await client
          .from("tracks")
          .select(COLUMNS)
          .order("created_at", { ascending: true });

        if (failure) {
          console.error("[tracks] load failed", failure);
          if (!silent) setError(true);
          return;
        }

        const rows = (data ?? []) as TrackRow[];
        const missing = [...new Set(rows.map((row) => row.storage_path))].filter(
          (path) => !signed.current.has(path),
        );

        if (missing.length > 0) {
          const { data: links } = await client.storage
            .from(BUCKET)
            .createSignedUrls(missing, SIGNED_URL_TTL);
          for (const item of links ?? []) {
            if (item.path && item.signedUrl) signed.current.set(item.path, item.signedUrl);
          }
        }

        setUploaded((previous) => {
          const known = new Map(previous.map((track) => [track.id, track]));
          const next = rows
            .map((row) => {
              const src = signed.current.get(row.storage_path) ?? "";
              const title =
                row.title?.trim() || row.storage_path.split("/").pop() || "Untitled";
              const artist = row.artist?.trim() || "";
              const duration = row.duration_seconds ?? undefined;
              const existing = known.get(row.id);
              // Same song, same link, same words: keep the object the player
              // already holds, so nothing reloads or re-renders for it.
              if (
                existing &&
                existing.src === src &&
                existing.title === title &&
                existing.artist === artist &&
                existing.duration === duration &&
                existing.storagePath === row.storage_path
              ) {
                return existing;
              }
              return {
                id: row.id,
                title,
                artist,
                src,
                duration,
                uploaded: true,
                storagePath: row.storage_path,
              } satisfies Track;
            })
            .filter((track) => track.src);

          // Nothing moved: hand back the same array and skip the render.
          if (
            next.length === previous.length &&
            next.every((track, index) => track === previous[index])
          ) {
            return previous;
          }
          return next;
        });

        if (!silent) setError(false);
      } finally {
        reading.current = false;
        if (!silent) setLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void read(false);
  }, [read]);

  // A song the other person adds is picked up when the tab comes back into
  // view — no reload, and the song that is playing never stops.
  useEffect(() => {
    if (!userId) return;

    let lastRead = 0;
    const refresh = () => {
      const now = Date.now();
      // Focus and visibility both fire for one return: read once.
      if (now - lastRead < 4000) return;
      lastRead = now;
      void read(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [read, userId]);

  const addTrack = useCallback(
    async (draft: TrackDraft): Promise<Track> => {
      const client = supabase;
      if (!client || !userId) throw new Error("not signed in");
      if (!isSupportedAudio(draft.file)) throw new Error("unsupported audio");

      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionFor(draft.file)}`;
      const path = `${userId}/${name}`;

      const { error: uploadFailure } = await client.storage
        .from(BUCKET)
        .upload(path, draft.file, {
          cacheControl: "86400",
          contentType: mimeFor(draft.file),
          upsert: false,
        });
      if (uploadFailure) throw uploadFailure;

      const { data, error: insertFailure } = await client
        .from("tracks")
        .insert({
          title: draft.title.trim(),
          artist: draft.artist.trim(),
          storage_path: path,
          duration_seconds:
            draft.duration && Number.isFinite(draft.duration)
              ? Math.round(draft.duration)
              : null,
          created_by: userId,
        })
        .select(COLUMNS)
        .single();

      if (insertFailure) {
        void client.storage.from(BUCKET).remove([path]);
        throw insertFailure;
      }

      const row = data as TrackRow;
      const { data: link } = await client.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL);
      // Cached, so the next focus re-read reuses this link instead of signing
      // a new one and restarting the song that was just added.
      if (link?.signedUrl) signed.current.set(path, link.signedUrl);

      const track: Track = {
        id: row.id,
        title: draft.title.trim() || draft.file.name.replace(/\.[^.]+$/, ""),
        artist: draft.artist.trim(),
        src: link?.signedUrl ?? "",
        duration: row.duration_seconds ?? undefined,
        uploaded: true,
        storagePath: path,
      };

      setUploaded((current) => [...current, track]);
      return track;
    },
    [userId],
  );

  const removeTrack = useCallback(async (track: Track) => {
    const client = supabase;
    if (!client) throw new Error("not signed in");

    const { error: failure } = await client.from("tracks").delete().eq("id", track.id);
    if (failure) throw failure;

    setUploaded((current) => current.filter((item) => item.id !== track.id));
    if (track.storagePath) {
      signed.current.delete(track.storagePath);
      void client.storage.from(BUCKET).remove([track.storagePath]);
    }
  }, []);

  const value = useMemo<TracksValue>(
    () => ({ uploaded, loading, error, addTrack, removeTrack }),
    [uploaded, loading, error, addTrack, removeTrack],
  );

  return <TracksContext.Provider value={value}>{children}</TracksContext.Provider>;
}

export function useTracks(): TracksValue {
  const context = useContext(TracksContext);
  if (!context) throw new Error("useTracks must be used inside TracksProvider");
  return context;
}

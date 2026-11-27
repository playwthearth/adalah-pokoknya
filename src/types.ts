export type Language = "en" | "id" | "ja";

/** A piece of content written in every supported language. */
export type Localized = Record<Language, string>;

export type LetterCategory =
  | "love"
  | "birthday"
  | "encouragement"
  | "thoughts"
  | "special";

export type DecorKind = "stamp" | "sticker" | "gif";

/** A stamp, a sticker, or an image/GIF linked from the internet. */
export interface LetterDecor {
  kind: DecorKind;
  /** Stamp or sticker id, or the https address of a GIF or picture. */
  value: string;
}

export interface Letter {
  id: string;
  title: Localized;
  /** ISO date, e.g. "2026-11-21" */
  date: string;
  category: LetterCategory;
  content: Localized;
  /** True for letters written in the app, not the built-in archive. */
  added?: boolean;
  /** The member who wrote it, so only they can remove it again. */
  authorId?: string | null;
  /** Displayable photo URL: a signed link for an upload. */
  image?: string | null;
  /** Storage path of the attached photo, kept so it can be removed too. */
  imagePath?: string | null;
  /** Stamps, stickers and internet pieces pinned to the letter. */
  decor?: LetterDecor[];
}

/** A moment either member added to the shared archive. */
export interface Memory {
  id: string;
  title: string;
  note: string;
  /** ISO date, e.g. "2026-01-01" */
  date: string;
  /** Displayable photo URL: a signed link for uploads, a path for the originals. */
  image: string | null;
  /** Storage path of an uploaded photo, used when the photo is replaced. */
  imagePath: string | null;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  /** Playable URL: a public file, or a signed link for an upload. */
  src: string;
  /** Optional duration in seconds, used until metadata loads. */
  duration?: number;
  /** True when the song was uploaded to the shared library. */
  uploaded?: boolean;
  /** Storage object path, kept so a removed song can be deleted too. */
  storagePath?: string | null;
  /** The song's own cover art, used for the album image when present. */
  cover?: string | null;
}

export type NoteKind = "daily" | "love";

/** A note either of the two members can leave for the other. */
export interface Note {
  id: string;
  author_id: string;
  author_email: string;
  author_name: string;
  kind: NoteKind;
  body: string;
  /** ISO timestamp */
  created_at: string;
}

export type MemberRole = "owner" | "member";

/** Someone allowed past the sign-in gate. */
export interface Member {
  email: string;
  role: MemberRole;
  created_at?: string;
}

export interface Identity {
  /** The person this place belongs to. */
  recipient: string;
  /** The person who wrote it. */
  author: string;
}

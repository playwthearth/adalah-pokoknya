export type Language = "en" | "id" | "ja";

/** A piece of content written in every supported language. */
export type Localized = Record<Language, string>;

export type LetterCategory =
  | "love"
  | "birthday"
  | "encouragement"
  | "thoughts"
  | "special";

export interface Letter {
  id: string;
  title: Localized;
  /** ISO date, e.g. "2026-11-21" */
  date: string;
  category: LetterCategory;
  content: Localized;
}

export interface Memory {
  id: string;
  title: Localized;
  /** ISO date, e.g. "2026-01-01" */
  date: string;
  image: string;
  description: Localized;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  /** Path under /public, e.g. "/assets/music/song.mp3" */
  src: string;
  /** Optional duration in seconds, used until metadata loads. */
  duration?: number;
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

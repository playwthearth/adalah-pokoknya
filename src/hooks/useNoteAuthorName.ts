import { useCallback } from "react";
import { site } from "../data/site";
import type { Note } from "../types";
import { useAuth } from "./useAuth";

/**
 * Notes are stamped with the author's email, so the name shown is decided when
 * they render. With two people in the room, a note that is not mine is hers.
 */
export function useNoteAuthorName(): (note: Pick<Note, "author_email" | "author_name">) => string {
  const { email, role } = useAuth();

  return useCallback(
    (note) => {
      if (!role) return note.author_name;
      const isMine = note.author_email.trim().toLowerCase() === email.trim().toLowerCase();
      const who = isMine ? role : role === "owner" ? "member" : "owner";
      return site.greetings[who];
    },
    [email, role],
  );
}

/** The name of whoever is signed in right now. */
export function useMyName(): string {
  const { role } = useAuth();
  return role ? site.greetings[role] : "";
}

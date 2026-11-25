import type { Track } from "../types";

/**
 * The playlist is intentionally small and replaceable.
 *
 * To add your own music:
 *  1. Drop the audio file into  public/assets/music/
 *  2. Add an entry below with the same path, e.g. "/assets/music/our-song.mp3"
 *  3. Keep `duration` optional — it is used until the browser reads metadata.
 */
export const playlist: Track[] = [
  {
    id: "am-i-bothering-you",
    title: "Am I Bothering You?",
    artist: "Reality Club",
    src: "/assets/music/Am%20I%20Bothering%20You%20-%20Reality%20Club.m4a",
    duration: 225,
  },
];

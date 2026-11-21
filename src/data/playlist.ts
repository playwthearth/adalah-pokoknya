import type { Track } from "../types";

/**
 * The playlist is intentionally small and replaceable.
 *
 * To add your own music:
 *  1. Drop the audio file into  public/assets/music/
 *  2. Add an entry below with the same path, e.g. "/assets/music/our-song.mp3"
 *  3. Keep `duration` optional — it is used until the browser reads metadata.
 *
 * The files shipped here are generated ambient tones, not music. Replace them.
 */
export const playlist: Track[] = [
  {
    id: "track-001",
    title: "Quiet Orbit",
    artist: "Placeholder tone",
    src: "/assets/music/placeholder-01.wav",
    duration: 26,
  },
  {
    id: "track-002",
    title: "Pale Signal",
    artist: "Placeholder tone",
    src: "/assets/music/placeholder-02.wav",
    duration: 28,
  },
  {
    id: "track-003",
    title: "Distant Shore",
    artist: "Placeholder tone",
    src: "/assets/music/placeholder-03.wav",
    duration: 24,
  },
];

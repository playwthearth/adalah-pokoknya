import type { Track } from "../types";

/**
 * The playlist is intentionally small and replaceable.
 *
 * To add your own music:
 *  1. Drop the audio file into  public/assets/music/
 *  2. Add an entry below with the same path, e.g. song("our-song.mp3")
 *  3. Keep `duration` optional — it is used until the browser reads metadata.
 */

/** Filenames carry spaces and Japanese characters; the browser needs them escaped. */
const song = (file: string) => encodeURI(`/assets/music/${file}`);

export const playlist: Track[] = [
  {
    id: "am-i-bothering-you",
    title: "Am I Bothering You?",
    artist: "Reality Club",
    src: song("Am I Bothering You - Reality Club.m4a"),
    duration: 225,
  },
  {
    id: "love-epiphany",
    title: "Love Epiphany",
    artist: "Reality Club",
    src: song("Love Epiphany - Reality Club.m4a"),
    duration: 339,
  },
  {
    id: "anything-you-want",
    title: "Anything You Want",
    artist: "Reality Club",
    src: song("Anything You Want - Reality Club.m4a"),
    duration: 236,
  },
  {
    id: "bad",
    title: "bad",
    artist: "wave to earth",
    src: song("bad - wave to earth.m4a"),
    duration: 263,
  },
  {
    id: "love",
    title: "love.",
    artist: "wave to earth",
    src: song("love. - wave to earth.m4a"),
    duration: 308,
  },
  {
    id: "crescendo",
    title: "Crescendo",
    artist: "NMIXX",
    src: song("Crescendo - NMIXX.m4a"),
    duration: 159,
  },
  {
    id: "heavy-serenade",
    title: "Heavy Serenade",
    artist: "NMIXX",
    src: song("Heavy Serenade - NMIXX.m4a"),
    duration: 180,
  },
  {
    id: "loud",
    title: "LOUD",
    artist: "NMIXX",
    src: song("LOUD - NMIXX.m4a"),
    duration: 170,
  },
  {
    id: "say-yes",
    title: "Say Yes",
    artist: "Loco, Punch",
    src: song("Say Yes - Loco, Punch.m4a"),
    duration: 219,
  },
  {
    id: "suki-dakara",
    title: "好きだから。",
    artist: "『ユイカ』, れん",
    src: song("好きだから。 - 『ユイカ』, れん.m4a"),
    duration: 299,
  },
];

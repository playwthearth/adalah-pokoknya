/**
 * Site-wide identity and personalization defaults.
 * Everything here can be overridden at runtime from Settings.
 */
export const site = {
  title: "A Place Beyond Time",
  jpTitle: "時を越えた場所",
  /** ISO date the relationship began — used for the counter and countdown. */
  startDate: "2026-08-28",
  /** IANA zone the day counter reads, so both people count the same days. */
  timezone: "Asia/Jakarta",
  names: {
    recipient: "Sora",
    author: "Me",
  },
  /** The name each account is greeted by, keyed by the role it signs in with. */
  greetings: {
    owner: "Ayyash",
    member: "Maureen",
  },
};

export const storageKeys = {
  language: "abt.language",
  /** "light" | "dark" | "system"; read by the inline boot script too. */
  theme: "abt.theme",
  /** Where the player stopped, so a reload resumes without autoplaying. */
  playerTrack: "abt.player.track",
  playerTime: "abt.player.time",
  /** Device-only player volume; names and the start date live in Supabase. */
  volume: "abt.settings.volume.v1",
  /** Earlier per-device copy of the settings; removed on load. */
  legacySettings: "abt.settings.v1",
  /** Last moment the reader did anything, so an idle visit can sign itself out. */
  lastActive: "abt.auth.lastActive",
} as const;

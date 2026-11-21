/**
 * Site-wide identity and personalization defaults.
 * Everything here can be overridden at runtime from Settings.
 */
export const site = {
  title: "A Place Beyond Time",
  jpTitle: "時を越えた場所",
  /** ISO date the relationship began — used for the counter and countdown. */
  startDate: "2024-02-14",
  names: {
    recipient: "Sora",
    author: "Me",
  },
};

export const storageKeys = {
  language: "abt.language",
  settings: "abt.settings.v1",
} as const;

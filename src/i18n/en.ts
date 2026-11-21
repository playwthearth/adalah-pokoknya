/**
 * English dictionary — the source of truth for every interface string.
 * Other languages mirror this exact shape (see `Dict`).
 */
export const en = {
  languageName: "English",
  languageShort: "EN",

  nav: {
    primary: "Primary navigation",
    dashboard: "Dashboard",
    letters: "Letters",
    memories: "Memories",
    playlist: "Playlist",
    settings: "Settings",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    backToTop: "Back to top",
  },

  landing: {
    eyebrow: "PRIVATE TRANSMISSION · 001",
    title: "A Place Beyond Time",
    subtitle: "A quiet little universe, made just for you.",
    greeting:
      "Somewhere between the hours, there is a room that only opens for you.",
    enter: "Enter",
    hint: "Nothing here is in a hurry. Take your time.",
    jp: "時を越えた場所",
    clockLabel: "LOCAL TIME",
    labels: {
      space: "Personal space",
      connection: "Connection established",
      archive: "Memory archive",
      transmission: "Private transmission",
    },
  },

  dashboard: {
    eyebrow: "CONNECTION ESTABLISHED",
    jp: "おかえりなさい",
    greeting: {
      morning: (name: string) => `Good morning, ${name}.`,
      afternoon: (name: string) => `Good afternoon, ${name}.`,
      evening: (name: string) => `Good evening, ${name}.`,
      night: (name: string) => `Still awake, ${name}?`,
    },
    intro:
      "Everything here stays — the letters, the photographs, the songs. None of it is in a hurry.",
    daily: {
      label: "DAILY TRANSMISSION",
      messages: [
        "You do not have to be anything other than what you are.",
        "Some distances are only as far as a thought of you.",
        "The quiet is easier when I know you are somewhere in it.",
        "Take the long way home. I will be here.",
      ],
    },
    together: {
      label: "TIME TOGETHER",
      days: "days",
      hours: "hours",
      minutes: "minutes",
      since: (date: string) => `Since ${date}`,
    },
    anniversary: {
      label: "NEXT ANNIVERSARY",
      daysLeft: (n: number) => `${n} days away`,
      today: "Today",
      upcoming: (n: number) => `In ${n} days`,
      notStarted: (n: number) => `The story begins in ${n} days`,
    },
    quick: {
      label: "QUICK ACCESS",
      subtitle: "Where would you like to go?",
      letters: "Letters for You",
      lettersDesc: "Words kept for the moments you need them.",
      memories: "Our Memories",
      memoriesDesc: "Photographs of days that stayed.",
      playlist: "Our Little Playlist",
      playlistDesc: "Songs that sound like certain evenings.",
      settings: "Settings",
      settingsDesc: "Language, sound, and the little details.",
    },
    system: {
      label: "SYSTEM",
      statusLabel: "STATUS",
      statusValue: "ALL QUIET",
      signalLabel: "SIGNAL",
      signalValue: "STABLE",
      archiveLabel: "ARCHIVE",
      archiveValue: "SEALED",
      locationLabel: "LOCATION",
      locationValue: "BEYOND TIME",
    },
    nowLabel: "RIGHT NOW",
  },

  letters: {
    eyebrow: "MEMORY ARCHIVE",
    title: "Letters for You",
    description:
      "Words I could not say out loud, kept here for whenever you need them.",
    count: (n: number) => `${n} letters`,
    all: "All letters",
    categories: {
      love: "Love Letters",
      birthday: "Birthday Messages",
      encouragement: "Encouragement",
      thoughts: "Random Thoughts",
      special: "Special Messages",
    },
    read: "Read letter",
    empty: "No letters in this collection yet.",
    emptyHint: "They will appear here as soon as they are written.",
    hint: "Press Esc to close",
    from: "With love",
  },

  memories: {
    eyebrow: "MEMORY ARCHIVE",
    title: "Our Memories",
    description: "Small moments that refused to be forgotten.",
    count: (n: number) => `${n} memories`,
    view: "Open memory",
    empty: "The archive is empty for now.",
    emptyHint: "Photographs will find their way here.",
    close: "Close",
    previous: "Previous memory",
    next: "Next memory",
  },

  playlist: {
    eyebrow: "AUDIO CHANNEL",
    title: "Our Little Playlist",
    description:
      "Songs that feel like certain days. Choose one, and stay a while.",
    nowPlaying: "NOW PLAYING",
    playlistLabel: "PLAYLIST",
    empty: "No songs yet.",
    emptyHint:
      "Add audio files to public/assets/music and list them in src/data/playlist.ts.",
    play: "Play",
    pause: "Pause",
    next: "Next track",
    previous: "Previous track",
    volume: "Volume",
    trackError: "This track could not be loaded.",
    placeholderNote:
      "The three tracks here are generated tones, standing in for your songs. Replace them whenever you are ready.",
    openPlayer: "Open player",
    select: "Play this track",
  },

  settings: {
    eyebrow: "PRIVATE TRANSMISSION",
    title: "Settings",
    description: "Small adjustments to make this space yours.",
    languageTitle: "Language",
    languageDesc: "The whole space changes with you.",
    audioTitle: "Audio",
    audioDesc: "Volume applies to the player in the corner.",
    volume: "Volume",
    personalTitle: "Personalization",
    personalDesc: "Names and dates used throughout the space.",
    theirName: "Her name",
    theirNamePlaceholder: "Name",
    yourName: "Your name",
    yourNamePlaceholder: "Name",
    anniversary: "The day it began",
    anniversaryHint:
      "Used for the counter, the countdown and the greeting.",
    reset: "Reset settings",
    resetConfirm: "Confirm reset",
    resetDone: "Settings restored.",
    autoSave: "Changes save automatically.",
    privacyTitle: "Privacy",
    privacyBody:
      "This is a private place. Keep the link to yourself — a hidden address is a curtain, not a lock. Real protection needs server-side authentication, and private letters and photographs should stay out of public repositories.",
  },

  footer: {
    note: "Private transmission. Keep the link close.",
    madeFor: (name: string) => `Made for ${name}`,
    rights: "A quiet place, kept by hand.",
  },

  common: {
    close: "Close",
    previous: "Previous",
    next: "Next",
    back: "Back",
    loading: "Loading",
    minutesShort: "min",
    secondsShort: "sec",
    of: "of",
  },
};

export type Dict = typeof en;

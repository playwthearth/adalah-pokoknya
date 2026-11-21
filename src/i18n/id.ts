import type { Dict } from "./en";

export const id: Dict = {
  languageName: "Bahasa Indonesia",
  languageShort: "ID",

  nav: {
    primary: "Navigasi utama",
    dashboard: "Dasbor",
    letters: "Surat",
    memories: "Kenangan",
    playlist: "Daftar Lagu",
    settings: "Pengaturan",
    openMenu: "Buka menu",
    closeMenu: "Tutup menu",
    backToTop: "Kembali ke atas",
  },

  landing: {
    eyebrow: "TRANSMISI PRIBADI · 001",
    title: "A Place Beyond Time",
    subtitle: "Alam kecil yang tenang, dibuat khusus untukmu.",
    greeting:
      "Di suatu tempat di antara jam-jam, ada ruang yang hanya terbuka untukmu.",
    enter: "Masuk",
    hint: "Tidak ada yang terburu-buru di sini. Luangkan waktumu.",
    jp: "時を越えた場所",
    clockLabel: "WAKTU LOKAL",
    labels: {
      space: "Ruang pribadi",
      connection: "Koneksi terhubung",
      archive: "Arsip kenangan",
      transmission: "Transmisi pribadi",
    },
  },

  dashboard: {
    eyebrow: "KONEKSI TERHUBUNG",
    jp: "おかえりなさい",
    greeting: {
      morning: (name: string) => `Selamat pagi, ${name}.`,
      afternoon: (name: string) => `Selamat siang, ${name}.`,
      evening: (name: string) => `Selamat malam, ${name}.`,
      night: (name: string) => `Belum tidur, ${name}?`,
    },
    intro:
      "Semua yang ada di sini tinggal — surat, foto, lagu. Tidak ada yang terburu-buru.",
    daily: {
      label: "PESAN HARIAN",
      messages: [
        "Kamu tidak perlu menjadi apa pun selain dirimu sendiri.",
        "Beberapa jarak hanya sejauh satu pikiran tentangmu.",
        "Sunyi terasa lebih ringan saat aku tahu kamu ada di dalamnya.",
        "Pulanglah lewat jalan yang panjang. Aku menunggu di sini.",
      ],
    },
    together: {
      label: "WAKTU BERSAMA",
      days: "hari",
      hours: "jam",
      minutes: "menit",
      since: (date: string) => `Sejak ${date}`,
    },
    anniversary: {
      label: "PERINGATAN BERIKUTNYA",
      daysLeft: (n: number) => `${n} hari lagi`,
      today: "Hari ini",
      upcoming: (n: number) => `Dalam ${n} hari`,
      notStarted: (n: number) => `Cerita ini dimulai dalam ${n} hari`,
    },
    quick: {
      label: "AKSES CEPAT",
      subtitle: "Mau ke mana?",
      letters: "Surat untukmu",
      lettersDesc: "Kata-kata yang kusimpan untuk saat kau membutuhkannya.",
      memories: "Kenangan kita",
      memoriesDesc: "Foto-foto dari hari-hari yang tinggal.",
      playlist: "Daftar lagu kita",
      playlistDesc: "Lagu yang terdengar seperti malam-malam tertentu.",
      settings: "Pengaturan",
      settingsDesc: "Bahasa, suara, dan detail-detail kecil.",
    },
    system: {
      label: "SISTEM",
      statusLabel: "STATUS",
      statusValue: "SEMUA TENANG",
      signalLabel: "SINYAL",
      signalValue: "STABIL",
      archiveLabel: "ARSIP",
      archiveValue: "TERSEGEL",
      locationLabel: "LOKASI",
      locationValue: "DI LUAR WAKTU",
    },
    nowLabel: "SAAT INI",
  },

  letters: {
    eyebrow: "ARSIP KENANGAN",
    title: "Surat untukmu",
    description:
      "Kata-kata yang tak sempat kuucapkan, kusimpan di sini untuk kapan pun kau membutuhkannya.",
    count: (n: number) => `${n} surat`,
    all: "Semua surat",
    categories: {
      love: "Surat cinta",
      birthday: "Pesan ulang tahun",
      encouragement: "Penyemangat",
      thoughts: "Pikiran acak",
      special: "Pesan istimewa",
    },
    read: "Baca surat",
    empty: "Belum ada surat di koleksi ini.",
    emptyHint: "Surat akan muncul di sini begitu ditulis.",
    hint: "Tekan Esc untuk menutup",
    from: "Dengan cinta",
  },

  memories: {
    eyebrow: "ARSIP KENANGAN",
    title: "Kenangan kita",
    description: "Momen-momen kecil yang menolak untuk dilupakan.",
    count: (n: number) => `${n} kenangan`,
    view: "Buka kenangan",
    empty: "Arsip masih kosong untuk sekarang.",
    emptyHint: "Foto-foto akan menemukan jalannya ke sini.",
    close: "Tutup",
    previous: "Kenangan sebelumnya",
    next: "Kenangan berikutnya",
  },

  playlist: {
    eyebrow: "SALURAN AUDIO",
    title: "Daftar lagu kita",
    description:
      "Lagu yang terasa seperti hari-hari tertentu. Pilih satu, dan tinggallah sebentar.",
    nowPlaying: "SEDANG DIPUTAR",
    playlistLabel: "DAFTAR LAGU",
    empty: "Belum ada lagu.",
    emptyHint:
      "Tambahkan file audio ke public/assets/music dan daftarkan di src/data/playlist.ts.",
    play: "Putar",
    pause: "Jeda",
    next: "Lagu berikutnya",
    previous: "Lagu sebelumnya",
    volume: "Volume",
    trackError: "Lagu ini tidak dapat dimuat.",
    placeholderNote:
      "Tiga lagu di sini adalah nada buatan, sebagai pengganti lagu kalian. Ganti kapan pun.",
    openPlayer: "Buka pemutar",
    select: "Putar lagu ini",
  },

  settings: {
    eyebrow: "TRANSMISI PRIBADI",
    title: "Pengaturan",
    description: "Penyesuaian kecil untuk membuat ruang ini milikmu.",
    languageTitle: "Bahasa",
    languageDesc: "Seluruh ruang ini ikut berubah bersamamu.",
    audioTitle: "Audio",
    audioDesc: "Volume berlaku untuk pemutar di pojok layar.",
    volume: "Volume",
    personalTitle: "Personalisasi",
    personalDesc: "Nama dan tanggal yang dipakai di seluruh ruang ini.",
    theirName: "Namanya",
    theirNamePlaceholder: "Nama",
    yourName: "Namamu",
    yourNamePlaceholder: "Nama",
    anniversary: "Hari ketika semuanya dimulai",
    anniversaryHint:
      "Dipakai untuk penghitung, hitungan mundur, dan sapaan.",
    reset: "Atur ulang pengaturan",
    resetConfirm: "Konfirmasi atur ulang",
    resetDone: "Pengaturan dipulihkan.",
    autoSave: "Perubahan tersimpan otomatis.",
    privacyTitle: "Privasi",
    privacyBody:
      "Ini tempat pribadi. Simpan tautannya untuk dirimu sendiri — alamat tersembunyi hanyalah tirai, bukan kunci. Perlindungan sungguhan memerlukan autentikasi sisi server, dan surat serta foto pribadi sebaiknya tidak disimpan di repositori publik.",
  },

  footer: {
    note: "Transmisi pribadi. Simpan tautannya baik-baik.",
    madeFor: (name: string) => `Dibuat untuk ${name}`,
    rights: "Tempat tenang, dirawat dengan tangan.",
  },

  common: {
    close: "Tutup",
    previous: "Sebelumnya",
    next: "Berikutnya",
    back: "Kembali",
    loading: "Memuat",
    minutesShort: "mnt",
    secondsShort: "dtk",
    of: "dari",
  },
};

import type { Memory } from "../types";

/**
 * Memory archive. Replace the image paths in `public/assets/images/`
 * with your own photographs — keep the filenames, or update the paths here.
 * Images are shown in a timeline and a lightbox.
 */
export const memories: Memory[] = [
  {
    id: "memory-001",
    title: {
      en: "The Empty Platform",
      id: "Peron yang Kosong",
      ja: "空のホーム",
    },
    date: "2026-01-01",
    image: "/assets/images/memory-001.jpg",
    description: {
      en: "The station was almost empty. We stood at the far end where the cold got in, waiting for a train that was late, and somehow nobody minded.",
      id: "Stasiun hampir kosong. Kami berdiri di ujung paling jauh, tempat dingin masuk, menunggu kereta yang terlambat, dan entah bagaimana tidak ada yang keberatan.",
      ja: "駅はほとんど空いていました。冷気の入るいちばん端で、遅れた電車を待っていて、なぜか誰も気にしていませんでした。",
    },
  },
  {
    id: "memory-002",
    title: {
      en: "Rain on the Window",
      id: "Hujan di Jendela",
      ja: "窓の雨",
    },
    date: "2026-03-14",
    image: "/assets/images/memory-002.jpg",
    description: {
      en: "It rained for three hours and we cancelled everything. You traced the water down the glass. I remember the exact sound of you being happy about nothing in particular.",
      id: "Hujan turun tiga jam dan kami membatalkan semua rencana. Kamu menelusuri air di kaca. Aku ingat persis suaramu saat bahagia tanpa alasan tertentu.",
      ja: "三時間雨が降って、予定は全部やめました。あなたはガラスを伝う水滴をなぞっていました。理由もなくうれしそうな、その声の感じを覚えています。",
    },
  },
  {
    id: "memory-003",
    title: {
      en: "Power Lines at Dusk",
      id: "Kabel Listrik Saat Senja",
      ja: "夕暮れの電線",
    },
    date: "2026-05-22",
    image: "/assets/images/memory-003.jpg",
    description: {
      en: "We walked home the long way because neither of us wanted the evening to end. The sky went the colour of the inside of a shell.",
      id: "Kami pulang lewat jalan yang panjang karena tak ada yang ingin malam itu berakhir. Langit berwarna seperti bagian dalam kerang.",
      ja: "どちらも夜を終わらせたくなかったので、遠回りして帰りました。空は貝の内側のような色をしていました。",
    },
  },
  {
    id: "memory-004",
    title: {
      en: "One Light on the Water",
      id: "Satu Cahaya di Air",
      ja: "水面のひとつの灯",
    },
    date: "2026-07-08",
    image: "/assets/images/memory-004.jpg",
    description: {
      en: "The sea was so still it looked like a held note. A single light somewhere far out, and you saying we should come back in winter.",
      id: "Lautnya begitu tenang sampai terlihat seperti nada yang ditahan. Satu cahaya jauh di luar sana, dan kamu bilang kita harus kembali saat musim dingin.",
      ja: "海はとても静かで、保たれた音のようでした。遠くにひとつの灯。冬にもう一度来ようと、あなたが言いました。",
    },
  },
  {
    id: "memory-005",
    title: {
      en: "The Curtain and the Morning",
      id: "Tirai dan Pagi",
      ja: "カーテンと朝",
    },
    date: "2026-09-02",
    image: "/assets/images/memory-005.jpg",
    description: {
      en: "Sunday light through the curtain, the room still half asleep. You said this was your favourite kind of weather and I have thought about it every clear morning since.",
      id: "Cahaya Minggu menembus tirai, kamar masih setengah tidur. Kamu bilang ini cuaca favoritmu, dan aku memikirkannya setiap pagi cerah sejak itu.",
      ja: "カーテン越しの日曜の光。部屋はまだ半分眠っていました。これがいちばん好きな天気だとあなたは言って、それ以来、晴れた朝のたびに思い出します。",
    },
  },
  {
    id: "memory-006",
    title: {
      en: "Two Cups, One Table",
      id: "Dua Cangkir, Satu Meja",
      ja: "二つのカップ、ひとつのテーブル",
    },
    date: "2026-10-19",
    image: "/assets/images/memory-006.jpg",
    description: {
      en: "Nothing important was said. That is precisely why it is here, at the end of the archive, where the ordinary things are kept.",
      id: "Tidak ada yang penting dibicarakan. Justru karena itu kenangan ini ada di sini, di ujung arsip, tempat hal-hal biasa disimpan.",
      ja: "大切なことは何も話していません。だからこそ、ありふれたものを置いておくこの記録のいちばん最後に、これがあります。",
    },
  },
];

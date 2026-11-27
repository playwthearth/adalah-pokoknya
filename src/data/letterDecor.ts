import type { LetterDecor } from "../types";

/** A letter can carry a small handful of loose pieces, not a whole drawer. */
export const MAX_DECOR = 6;

export type StampTone = "navy" | "plum" | "cyan" | "ember";

export interface StampDesign {
  id: string;
  top: string;
  label: string;
  bottom: string;
  tone: StampTone;
}

/**
 * Stamps are drawn from type and borders rather than pictures, so they stay
 * crisp at any size and add no image to load.
 */
export const STAMPS: StampDesign[] = [
  { id: "par-avion", top: "AIR MAIL", label: "PAR AVION", bottom: "航空便", tone: "navy" },
  { id: "with-love", top: "TOKYO", label: "WITH LOVE", bottom: "恋文", tone: "plum" },
  { id: "keep", top: "PRIVATE", label: "KEEP THIS", bottom: "大切に", tone: "cyan" },
  { id: "forever", top: "2026", label: "FOREVER", bottom: "永遠に", tone: "ember" },
];

export interface StickerDesign {
  id: string;
  glyph: string;
  name: string;
}

export const STICKERS: StickerDesign[] = [
  { id: "sakura", glyph: "🌸", name: "Sakura" },
  { id: "moon", glyph: "🌙", name: "Moon" },
  { id: "ribbon", glyph: "🎀", name: "Ribbon" },
  { id: "dove", glyph: "🕊️", name: "Dove" },
  { id: "tea", glyph: "🍵", name: "Tea" },
  { id: "envelope", glyph: "✉️", name: "Envelope" },
  { id: "lotus", glyph: "🪷", name: "Lotus" },
  { id: "star", glyph: "⭐", name: "Star" },
];

export function findStamp(id: string): StampDesign | undefined {
  return STAMPS.find((stamp) => stamp.id === id);
}

export function findSticker(id: string): StickerDesign | undefined {
  return STICKERS.find((sticker) => sticker.id === id);
}

export function decorName(item: LetterDecor): string {
  if (item.kind === "stamp") return findStamp(item.value)?.label ?? "Stamp";
  if (item.kind === "sticker") return findSticker(item.value)?.name ?? "Sticker";
  try {
    return new URL(item.value).hostname.replace(/^www\./, "") || "GIF";
  } catch {
    return "GIF";
  }
}

export function decorGlyph(item: LetterDecor): string {
  if (item.kind === "sticker") return findSticker(item.value)?.glyph ?? "✂";
  if (item.kind === "stamp") return "✉";
  return "✦";
}

/** True for the addresses a decoration may point at. */
export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Stored decorations are untrusted input: keep only the shapes this app knows,
 * only https images, and never more than the limit.
 */
export function readDecor(value: unknown): LetterDecor[] {
  if (!Array.isArray(value)) return [];
  const items: LetterDecor[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const kind = (entry as { kind?: unknown }).kind;
    const source = (entry as { value?: unknown }).value;
    if (typeof source !== "string" || source.length === 0 || source.length > 500) continue;
    if (kind === "stamp" || kind === "sticker") {
      items.push({ kind, value: source });
    } else if (kind === "gif" && isHttpsUrl(source)) {
      items.push({ kind, value: source });
    }
    if (items.length === MAX_DECOR) break;
  }
  return items;
}

import type { Language } from "../types";
import { en, type Dict } from "./en";
import { id } from "./id";
import { ja } from "./ja";

export const dictionaries: Record<Language, Dict> = { en, id, ja };

export const languages: { code: Language; name: string; short: string }[] = [
  { code: "en", name: en.languageName, short: en.languageShort },
  { code: "id", name: id.languageName, short: id.languageShort },
  { code: "ja", name: ja.languageName, short: ja.languageShort },
];

/** BCP 47 locale used for Intl formatting. */
export const locales: Record<Language, string> = {
  en: "en-GB",
  id: "id-ID",
  ja: "ja-JP",
};

export const htmlLangs: Record<Language, string> = {
  en: "en",
  id: "id",
  ja: "ja",
};

export type { Dict };

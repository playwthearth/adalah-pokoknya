import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { storageKeys } from "../data/site";
import { dictionaries, htmlLangs, locales, type Dict } from "../i18n";
import type { Language } from "../types";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  /** Dictionary for the current language. */
  t: Dict;
  /** BCP 47 locale for Intl formatting. */
  locale: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(storageKeys.language);
    if (stored === "en" || stored === "id" || stored === "ja") return stored;
  } catch {
    // localStorage unavailable — fall through to the default.
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = htmlLangs[language];
    try {
      window.localStorage.setItem(storageKeys.language, language);
    } catch {
      // Ignore storage failures: the choice still applies for this session.
    }
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: dictionaries[language],
      locale: locales[language],
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

import { ChevronDown, Globe } from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { languages } from "../i18n";
import type { Language } from "../types";

interface LanguageSelectorProps {
  className?: string;
  /** Full names instead of codes (used inside the mobile menu and settings). */
  verbose?: boolean;
}

export function LanguageSelector({ className = "", verbose = false }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className={`relative inline-flex items-center gap-2 border border-line/80 bg-white/40 px-2.5 py-2 transition-colors hover:border-navy/30 ${className}`}
    >
      <Globe size={12} strokeWidth={1.5} aria-hidden="true" className="text-muted-strong" />
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        aria-label={t.settings.languageTitle}
        className="label cursor-pointer appearance-none bg-transparent pr-4 tracking-[0.18em] text-navy outline-none"
      >
        {languages.map((option) => (
          <option key={option.code} value={option.code}>
            {verbose ? option.name : option.short}
          </option>
        ))}
      </select>
      <ChevronDown
        size={10}
        strokeWidth={1.5}
        aria-hidden="true"
        className="pointer-events-none absolute right-2 text-muted-strong"
      />
    </div>
  );
}

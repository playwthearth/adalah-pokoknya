import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { SectionHeader } from "../components/SectionHeader";
import { useLanguage } from "../hooks/useLanguage";
import { useSettings } from "../hooks/useSettings";
import { languages } from "../i18n";

const fieldClass =
  "w-full border-0 border-b border-line bg-transparent py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-navy";

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t border-line/70 py-9 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:gap-10">
      <div>
        <h2 className="font-display text-xl font-light text-ink">{title}</h2>
        {description && (
          <p className="mt-2 text-[12px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { settings, update, reset } = useSettings();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirming]);

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setDone(false), 3200);
    return () => window.clearTimeout(id);
  }, [done]);

  const handleReset = () => {
    if (confirming) {
      reset();
      setConfirming(false);
      setDone(true);
    } else {
      setConfirming(true);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <SectionHeader
        eyebrow={t.settings.eyebrow}
        title={t.settings.title}
        jp="設定"
        description={t.settings.description}
        aside={<span className="label">{t.settings.autoSave}</span>}
      />

      <div className="mt-4">
        <Panel title={t.settings.languageTitle} description={t.settings.languageDesc}>
          <div className="grid gap-2 sm:grid-cols-3">
            {languages.map((option) => {
              const active = language === option.code;
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setLanguage(option.code)}
                  aria-pressed={active}
                  className={`group border px-4 py-3 text-left transition-colors ${
                    active
                      ? "border-navy bg-white/60"
                      : "border-line/80 hover:border-navy/35 hover:bg-white/30"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="label">{option.short}</span>
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? "bg-ember" : "bg-line"
                      }`}
                    />
                  </span>
                  <span className="mt-2 block font-display text-base font-light text-ink">
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title={t.settings.audioTitle} description={t.settings.audioDesc}>
          <div className="flex items-center gap-4">
            <label htmlFor="settings-volume" className="label shrink-0">
              {t.settings.volume}
            </label>
            <input
              id="settings-volume"
              type="range"
              className="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.volume}
              onChange={(event) => update({ volume: Number(event.target.value) })}
              style={{ "--fill": `${settings.volume * 100}%` } as CSSProperties}
            />
            <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted">
              {Math.round(settings.volume * 100)}
            </span>
          </div>
        </Panel>

        <Panel title={t.settings.personalTitle} description={t.settings.personalDesc}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="recipient-name" className="label">
                {t.settings.theirName}
              </label>
              <input
                id="recipient-name"
                type="text"
                maxLength={40}
                autoComplete="off"
                value={settings.recipient}
                placeholder={t.settings.theirNamePlaceholder}
                onChange={(event) => update({ recipient: event.target.value })}
                className={`${fieldClass} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="author-name" className="label">
                {t.settings.yourName}
              </label>
              <input
                id="author-name"
                type="text"
                maxLength={40}
                autoComplete="off"
                value={settings.author}
                placeholder={t.settings.yourNamePlaceholder}
                onChange={(event) => update({ author: event.target.value })}
                className={`${fieldClass} mt-2`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="start-date" className="label">
                {t.settings.anniversary}
              </label>
              <input
                id="start-date"
                type="date"
                value={settings.startDate}
                onChange={(event) => {
                  if (event.target.value) update({ startDate: event.target.value });
                }}
                className={`${fieldClass} mt-2 max-w-[220px] font-mono text-[12px]`}
              />
              <p className="mt-2 text-[11px] leading-relaxed text-muted/80">
                {t.settings.anniversaryHint}
              </p>
            </div>
          </div>
        </Panel>

        <Panel title={t.settings.privacyTitle}>
          <p className="text-[12.5px] leading-relaxed text-muted">{t.settings.privacyBody}</p>
        </Panel>

        <div className="border-t border-line/70 py-9">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleReset}
              className={`inline-flex items-center gap-2 border px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] transition-colors ${
                confirming
                  ? "border-ember bg-ember text-mist hover:bg-ember/90"
                  : "border-line text-navy/70 hover:border-navy/40 hover:text-ink"
              }`}
            >
              <RotateCcw size={12} strokeWidth={1.5} aria-hidden="true" />
              {confirming ? t.settings.resetConfirm : t.settings.reset}
            </button>
            <p aria-live="polite" className="text-[11px] text-muted">
              {done ? t.settings.resetDone : t.settings.autoSave}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

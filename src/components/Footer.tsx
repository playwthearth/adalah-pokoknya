import { site } from "../data/site";
import { useLanguage } from "../hooks/useLanguage";
import { useSettings } from "../hooks/useSettings";

export function Footer() {
  const { t } = useLanguage();
  const { settings } = useSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-line/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-9 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="font-display text-[11px] uppercase tracking-[0.26em] text-ink">
            {site.title}
          </p>
          <p className="jp mt-1.5 text-[10px] tracking-[0.28em] text-muted-strong">
            {site.jpTitle}
          </p>
        </div>
        <p className="label hidden sm:block">{t.footer.note}</p>
        <div className="label flex flex-wrap items-center gap-x-3 gap-y-2">
          <span>{t.footer.madeFor(settings.recipient)}</span>
          <span aria-hidden="true" className="text-ember/70">
            ·
          </span>
          <span>{year}</span>
        </div>
      </div>
    </footer>
  );
}

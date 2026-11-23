import { site } from "../data/site";
import { useLanguage } from "../hooks/useLanguage";

export function Footer() {
  const { t } = useLanguage();
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
        <div className="hidden flex-col items-center gap-2 sm:flex">
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ember/70" />
          <p className="label">{t.footer.note}</p>
        </div>
        <div>
          <p className="label flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
            <span>{t.footer.madeFor}</span>
            <span aria-hidden="true" className="text-ember/70">
              ·
            </span>
            <span>{year}</span>
          </p>
          <p aria-hidden="true" className="serial mt-3 text-[8px] text-muted-strong/70 sm:text-right">
            00 — 零
          </p>
        </div>
      </div>
    </footer>
  );
}

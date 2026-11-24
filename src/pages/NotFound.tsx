import { ArrowLeft } from "lucide-react";
import { CornerTicks } from "../components/ReiMarks";
import type { Route } from "../hooks/useHashRoute";
import { useLanguage } from "../hooks/useLanguage";

interface NotFoundProps {
  onNavigate: (route: Route) => void;
}

export function NotFound({ onNavigate }: NotFoundProps) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="surface relative w-full p-8 sm:p-12">
        <CornerTicks className="inset-2 z-10 sm:inset-3" />

        <div className="flex items-center justify-center gap-2.5">
          <span
            aria-hidden="true"
            className="signal-dot h-2 w-2 rounded-full bg-ember"
          />
          <p className="label tracking-[0.24em] text-ember">
            {t.notFound.eyebrow}
          </p>
        </div>

        <h1 className="hero-halo mt-6 font-display text-3xl font-light text-ink sm:text-4xl">
          {t.notFound.title}
        </h1>

        <div aria-hidden="true" className="mt-6 flex items-center justify-center gap-3">
          <span className="hair-rule w-12 -scale-x-100" />
          <span className="h-1 w-1 rounded-full bg-ember" />
          <span className="hair-rule w-12" />
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted-strong">
          {t.notFound.subtitle}
        </p>

        <p aria-hidden="true" className="serial mt-4 text-[9px] text-navy/40">
          STATUS: UNMAPPED / 00
        </p>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => onNavigate("dashboard")}
            className="press inline-flex min-h-11 items-center gap-2 border border-navy/70 bg-navy px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-mist hover:border-navy hover:bg-navy/90"
          >
            <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
            {t.notFound.returnDashboard}
          </button>
        </div>
      </div>
    </div>
  );
}

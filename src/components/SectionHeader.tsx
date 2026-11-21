import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  jp?: string;
  description?: string;
  aside?: ReactNode;
}

export function SectionHeader({ eyebrow, title, jp, description, aside }: SectionHeaderProps) {
  return (
    <header className="border-b border-line/80 pb-8 sm:pb-10">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
        <div className="max-w-2xl">
          <p className="label flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-6 bg-ember/80" />
            {eyebrow}
          </p>
          <h1 className="mt-6 text-4xl font-extralight tracking-tight text-ink sm:text-5xl">
            {title}
            {jp && (
              <span className="jp ml-3 align-baseline text-sm font-light tracking-[0.2em] text-muted">
                {jp}
              </span>
            )}
          </h1>
          {description && (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">{description}</p>
          )}
        </div>
        {aside && <div className="pb-1">{aside}</div>}
      </div>
    </header>
  );
}

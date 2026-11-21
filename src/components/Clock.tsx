import { useLanguage } from "../hooks/useLanguage";
import { useNow } from "../hooks/useNow";
import { formatClock, formatLongDate } from "../utils/format";

interface ClockProps {
  className?: string;
  size?: "sm" | "lg";
  label?: string;
  showDate?: boolean;
}

export function Clock({ className, size = "sm", label, showDate = false }: ClockProps) {
  const now = useNow();
  const { locale } = useLanguage();

  return (
    <div className={className}>
      {label && <p className="label mb-2">{label}</p>}
      <time
        dateTime={now.toISOString()}
        className={
          size === "lg"
            ? "block font-mono text-4xl font-normal tabular-nums tracking-[0.12em] text-ink sm:text-5xl"
            : "block font-mono text-xs tabular-nums tracking-[0.2em] text-navy/80"
        }
      >
        {formatClock(now, locale)}
      </time>
      {showDate && (
        <p className="label mt-3 tracking-[0.16em]">{formatLongDate(now, locale)}</p>
      )}
    </div>
  );
}

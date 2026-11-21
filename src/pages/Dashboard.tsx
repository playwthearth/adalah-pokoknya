import { ArrowUpRight, Images, Mail, Music2, SlidersHorizontal } from "lucide-react";
import type { ComponentType } from "react";
import { Clock } from "../components/Clock";
import { Reveal } from "../components/Reveal";
import { TypingText } from "../components/TypingText";
import { site } from "../data/site";
import type { Route } from "../hooks/useHashRoute";
import { useLanguage } from "../hooks/useLanguage";
import { useNow } from "../hooks/useNow";
import { useSettings } from "../hooks/useSettings";
import {
  daysBetween,
  formatDate,
  greetingKey,
  nextAnniversary,
  parseISODate,
} from "../utils/format";

interface DashboardProps {
  onNavigate: (route: Route) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { t, locale } = useLanguage();
  const { settings } = useSettings();
  const now = useNow();

  const name = settings.recipient.trim() || site.names.recipient;
  const start = parseISODate(settings.startDate);
  const validStart = !Number.isNaN(start.getTime());
  const elapsedMs = now.getTime() - start.getTime();
  const started = validStart && elapsedMs > 0;

  const days = started ? Math.floor(elapsedMs / 86_400_000) : 0;
  const hours = started ? Math.floor(elapsedMs / 3_600_000) % 24 : 0;
  const minutes = started ? Math.floor(elapsedMs / 60_000) % 60 : 0;

  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  const dailyMessages = t.dashboard.daily.messages;
  const dailyMessage = dailyMessages[(dayOfYear - 1) % dailyMessages.length];

  const nextAnniversaryDate = validStart ? nextAnniversary(start, now) : null;
  let countdown: string = "—";
  if (validStart) {
    if (!started) {
      countdown = t.dashboard.anniversary.notStarted(
        Math.max(1, Math.ceil(-elapsedMs / 86_400_000)),
      );
    } else if (nextAnniversaryDate) {
      const left = daysBetween(now, nextAnniversaryDate);
      countdown =
        left <= 0 ? t.dashboard.anniversary.today : t.dashboard.anniversary.daysLeft(left);
    }
  }

  const systemRows = [
    [t.dashboard.system.statusLabel, t.dashboard.system.statusValue],
    [t.dashboard.system.signalLabel, t.dashboard.system.signalValue],
    [t.dashboard.system.archiveLabel, t.dashboard.system.archiveValue],
    [t.dashboard.system.locationLabel, t.dashboard.system.locationValue],
  ];

  const quickLinks: {
    route: Route;
    icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    title: string;
    description: string;
  }[] = [
    {
      route: "letters",
      icon: Mail,
      title: t.dashboard.quick.letters,
      description: t.dashboard.quick.lettersDesc,
    },
    {
      route: "memories",
      icon: Images,
      title: t.dashboard.quick.memories,
      description: t.dashboard.quick.memoriesDesc,
    },
    {
      route: "playlist",
      icon: Music2,
      title: t.dashboard.quick.playlist,
      description: t.dashboard.quick.playlistDesc,
    },
    {
      route: "settings",
      icon: SlidersHorizontal,
      title: t.dashboard.quick.settings,
      description: t.dashboard.quick.settingsDesc,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <p className="label flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="signal-dot h-1.5 w-1.5 rounded-full bg-ember"
            />
            {t.dashboard.eyebrow}
          </p>

          <h1 className="mt-7 min-h-[2.4em] font-display text-[clamp(2rem,5vw,3.5rem)] font-extralight leading-[1.08] text-ink">
            <TypingText
              text={t.dashboard.greeting[greetingKey(now.getHours())](name)}
              speed={38}
              delay={250}
            />
          </h1>

          <p className="jp mt-3 text-sm tracking-[0.32em] text-muted">{t.dashboard.jp}</p>
          <p className="mt-6 max-w-lg text-[13px] leading-loose text-muted">
            {t.dashboard.intro}
          </p>
        </div>

        <Reveal delay={0.15} className="lg:pt-1">
          <aside className="surface h-full p-6">
            <div className="flex items-center justify-between">
              <p className="label">{t.dashboard.nowLabel}</p>
              <span aria-hidden="true" className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-cyan" />
                <span className="h-1 w-1 rounded-full bg-cyan/70" />
                <span className="h-1 w-1 rounded-full bg-ember/80" />
              </span>
            </div>

            <Clock className="mt-5" size="lg" showDate />

            <dl className="mt-7 divide-y divide-line/60 border-t border-line/60">
              {systemRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="label">{label}</dt>
                  <dd className="font-mono text-[10px] uppercase tracking-[0.18em] text-navy/75">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </Reveal>
      </section>

      <section className="mt-12 grid gap-5 sm:mt-16 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Reveal>
          <div className="surface flex h-full flex-col justify-between p-7 sm:p-9">
            <div className="flex items-center justify-between">
              <p className="label">{t.dashboard.daily.label}</p>
              <span className="font-mono text-[10px] tabular-nums tracking-[0.16em] text-muted/80">
                {String(dayOfYear).padStart(3, "0")} / 365
              </span>
            </div>

            <blockquote className="mt-9 min-h-[5.5rem]">
              <span aria-hidden="true" className="font-display text-2xl text-ember/60">
                “
              </span>
              <p className="mt-2 font-display text-xl font-extralight leading-snug text-ink sm:text-[1.7rem]">
                <TypingText text={dailyMessage} speed={26} delay={600} />
              </p>
            </blockquote>

            <div className="mt-7 flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-ember/70" />
              <span className="jp text-[10px] tracking-[0.32em] text-muted">今日の言葉</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="surface h-full p-7">
            <p className="label">{t.dashboard.together.label}</p>

            <div className="mt-5 flex items-end gap-3">
              <span className="font-display text-6xl font-extralight leading-none tabular-nums text-ink">
                {days}
              </span>
              <span className="pb-1.5 text-[11px] uppercase tracking-[0.2em] text-muted">
                {t.dashboard.together.days}
              </span>
            </div>
            <p className="mt-2 font-mono text-[11px] tabular-nums tracking-[0.12em] text-muted">
              {hours} {t.dashboard.together.hours} · {minutes} {t.dashboard.together.minutes}
            </p>
            <p className="label mt-4 text-[9px]">
              {t.dashboard.together.since(formatDate(settings.startDate, locale))}
            </p>

            <div className="mt-6 border-t border-line/60 pt-5">
              <p className="label">{t.dashboard.anniversary.label}</p>
              <p className="mt-2 font-display text-xl font-light text-navy">{countdown}</p>
              {nextAnniversaryDate && started && (
                <p className="label mt-1.5 text-[9px]">
                  {formatDate(
                    `${nextAnniversaryDate.getFullYear()}-${String(
                      nextAnniversaryDate.getMonth() + 1,
                    ).padStart(2, "0")}-${String(nextAnniversaryDate.getDate()).padStart(2, "0")}`,
                    locale,
                  )}
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mt-12 sm:mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="label">{t.dashboard.quick.label}</p>
          <p className="text-xs text-muted">{t.dashboard.quick.subtitle}</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <Reveal key={link.route} delay={index * 0.06}>
                <button
                  type="button"
                  onClick={() => onNavigate(link.route)}
                  className="group flex h-full w-full flex-col justify-between border border-line/80 bg-white/45 p-5 text-left transition-all duration-300 hover:border-navy/30 hover:bg-white/75"
                >
                  <span className="flex items-start justify-between">
                    <Icon
                      size={16}
                      strokeWidth={1.4}
                      className="text-navy/70 transition-colors group-hover:text-ink"
                    />
                    <span className="label text-[9px]">0{index + 1}</span>
                  </span>
                  <span className="mt-9 block">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display text-base font-light text-ink">
                        {link.title}
                      </span>
                      <ArrowUpRight
                        size={13}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="shrink-0 text-muted/70 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-navy"
                      />
                    </span>
                    <span className="mt-1.5 block text-[11px] leading-relaxed text-muted">
                      {link.description}
                    </span>
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}

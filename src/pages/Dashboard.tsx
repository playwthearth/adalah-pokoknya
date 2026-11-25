import { ArrowUpRight, Images, Mail, Music2, SlidersHorizontal } from "lucide-react";
import type { ComponentType } from "react";
import { Clock } from "../components/Clock";
import { CountUp } from "../components/CountUp";
import { Blossom, CornerTicks, VineLines } from "../components/Marks";
import { Reveal } from "../components/Reveal";
import { TypingText } from "../components/TypingText";
import { site } from "../data/site";
import { useAuth } from "../hooks/useAuth";
import type { Route } from "../hooks/useHashRoute";
import { useLanguage } from "../hooks/useLanguage";
import { useNoteAuthorName } from "../hooks/useNoteAuthorName";
import { useNotes } from "../hooks/useNotes";
import { useNow } from "../hooks/useNow";
import { useSettings } from "../hooks/useSettings";
import {
  civilMs,
  formatDate,
  greetingKey,
  parseISODate,
  zonedDateKey,
  zonedParts,
} from "../utils/format";

interface DashboardProps {
  onNavigate: (route: Route) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { t, locale } = useLanguage();
  const { role } = useAuth();
  const { settings } = useSettings();
  // Update every minute (60,000ms): Clock handles its own 1s tick independently,
  // preventing 60 unnecessary full-tree Dashboard re-renders per minute.
  const now = useNow(60_000);
  const { notes, loading: notesLoading, error: notesError } = useNotes();
  const noteAuthor = useNoteAuthorName();

  // Greet whoever is signed in: the owner seat by one name, the member by another.
  const name = (role && site.greetings[role]) || settings.recipient.trim() || site.names.recipient;
  const start = parseISODate(settings.startDate);
  const validStart = !Number.isNaN(start.getTime());

  // Both people read the same clock: the shared zone decides what day it is,
  // so the counter cannot disagree by a day across devices.
  const zone = settings.timezone;
  const zoneNow = zonedParts(now, zone) ?? {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds(),
  };
  const startParts = validStart
    ? { year: start.getFullYear(), month: start.getMonth() + 1, day: start.getDate() }
    : null;

  const elapsedMs = startParts ? civilMs(zoneNow) - civilMs(startParts) : Number.NaN;
  const started = validStart && elapsedMs > 0;

  const days = started ? Math.floor(elapsedMs / 86_400_000) : 0;
  const hours = started ? Math.floor(elapsedMs / 3_600_000) % 24 : 0;
  const minutes = started ? Math.floor(elapsedMs / 60_000) % 60 : 0;

  const daysInYear =
    new Date(Date.UTC(zoneNow.year, 1, 29)).getUTCMonth() === 1 ? 366 : 365;
  const dayOfYear =
    Math.floor(
      (civilMs(zoneNow) - civilMs({ year: zoneNow.year, month: 1, day: 1 })) / 86_400_000,
    ) + 1;
  const dailyMessages = t.dashboard.daily.messages;
  const dailyMessage = dailyMessages[(dayOfYear - 1) % dailyMessages.length];

  let nextAnniversaryISO: string | null = null;
  let countdown: string = "—";
  if (validStart && startParts) {
    if (!started) {
      countdown = t.dashboard.anniversary.notStarted(
        Math.max(1, Math.ceil(-elapsedMs / 86_400_000)),
      );
    } else {
      const today = Date.UTC(zoneNow.year, zoneNow.month - 1, zoneNow.day) / 86_400_000;
      let next = Date.UTC(zoneNow.year, startParts.month - 1, startParts.day) / 86_400_000;
      if (next <= today) {
        next = Date.UTC(zoneNow.year + 1, startParts.month - 1, startParts.day) / 86_400_000;
      }
      const left = next - today;
      countdown =
        left <= 0 ? t.dashboard.anniversary.today : t.dashboard.anniversary.daysLeft(left);
      nextAnniversaryISO = new Date(next * 86_400_000).toISOString().slice(0, 10);
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
      <section className="relative grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-14">
        <VineLines className="pointer-events-none absolute -right-6 -top-16 hidden h-[300px] w-[180px] text-periwinkle/40 xl:block" />
        <div className="hero-halo">
          <p className="label flex items-center gap-2.5">
            <Blossom className="h-3 w-3 text-powder" />
            {t.dashboard.eyebrow}
          </p>

          <h1 className="mt-7 min-h-[2.4em] font-display text-[clamp(2rem,5vw,3.5rem)] font-extralight leading-[1.08] text-ink">
            <TypingText
              text={t.dashboard.greeting[greetingKey(now.getHours())](name)}
              speed={38}
              delay={250}
            />
          </h1>

          <p className="jp mt-3 text-sm tracking-[0.32em] text-muted-strong">{t.dashboard.jp}</p>
          <p className="mt-6 max-w-lg text-[13px] leading-loose text-muted-strong">
            {t.dashboard.intro}
          </p>
        </div>

        <Reveal delay={0.15} className="lg:pt-1">
          <aside className="surface hud-grid h-full p-6">
            <CornerTicks className="inset-0" />
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
          <div className="surface hover-lift group relative flex h-full flex-col justify-between p-7 sm:p-9">
            <CornerTicks className="inset-0" />
            <div className="flex items-center justify-between">
              <p className="label">{t.dashboard.daily.label}</p>
              <span className="font-mono text-[10px] tabular-nums tracking-[0.16em] text-muted-strong">
                {String(dayOfYear).padStart(3, "0")} / {daysInYear}
              </span>
            </div>

            <blockquote className="mt-9 min-h-[5.5rem]">
              <span
                aria-hidden="true"
                className="inline-block font-display text-2xl text-ember/60 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:text-ember/90"
              >
                “
              </span>
              <p className="mt-2 font-serif text-[1.35rem] italic leading-snug text-ink sm:text-[1.65rem]">
                <TypingText text={dailyMessage} speed={26} delay={600} />
              </p>
            </blockquote>

            <div className="mt-7 flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-8 bg-ember/70" />
              <span className="label text-[10px] tracking-[0.24em] text-muted-strong">
                {t.dashboard.daily.signature}
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="surface h-full p-7">
            <p className="label">{t.dashboard.together.label}</p>

            <div className="mt-5 flex items-end gap-3">
              <CountUp
                value={days}
                className="font-display text-6xl font-extralight leading-none tabular-nums text-ink"
              />
              <span className="pb-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-strong">
                {t.dashboard.together.days}
              </span>
            </div>
            <p className="mt-2 font-mono text-[11px] tabular-nums tracking-[0.12em] text-muted-strong">
              {hours} {t.dashboard.together.hours} · {minutes} {t.dashboard.together.minutes}
            </p>
            <p className="label mt-4 text-[9px]">
              {t.dashboard.together.since(formatDate(settings.startDate, locale))}
            </p>

            <div className="mt-6 border-t border-line/60 pt-5">
              <p className="label">{t.dashboard.anniversary.label}</p>
              <p className="mt-2 font-display text-xl font-light text-navy">{countdown}</p>
              {nextAnniversaryISO && started && (
                <p className="label mt-1.5 text-[9px]">
                  {formatDate(nextAnniversaryISO, locale)}
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mt-12 sm:mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="label">{t.notes.latest}</p>
          <button
            type="button"
            onClick={() => onNavigate("notes")}
            className="btn-quiet"
          >
            {t.notes.viewAll}
            <ArrowUpRight size={12} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {notesLoading ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="h-36 animate-pulse border border-line/60 bg-surface/30"
              />
            ))}
          </div>
        ) : notesError ? (
          <p className="mt-5 text-[12px] text-muted-strong">{t.notes.loadError}</p>
        ) : notes.length === 0 ? (
          <div className="mt-5 border border-dashed border-line/80 bg-surface/25 p-6">
            <p className="font-display text-lg font-light text-ink">{t.notes.empty}</p>
            <p className="mt-1 text-[12px] text-muted-strong">{t.notes.emptyHint}</p>
            <button
              type="button"
              onClick={() => onNavigate("notes")}
              className="btn-quiet mt-4"
            >
              {t.notes.composerTitle}
              <ArrowUpRight size={12} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {notes.slice(0, 3).map((note) => (
              <article
                key={note.id}
                className="hover-lift rail flex flex-col justify-between border border-line/80 bg-surface/45 p-5 hover:border-navy/20 hover:bg-surface/70"
              >
                <div>
                  <p className="label flex items-center gap-2 text-[9px]">
                    <span
                      aria-hidden="true"
                      className={`h-1 w-1 rounded-full ${
                        note.kind === "love" ? "bg-ember" : "bg-cyan"
                      }`}
                    />
                    {note.kind === "love" ? t.notes.kindLove : t.notes.kindDaily}
                  </p>
                  <p className="mt-4 line-clamp-4 whitespace-pre-wrap text-[13px] leading-relaxed text-navy/85">
                    {note.body}
                  </p>
                </div>
                <p className="label mt-5 text-[9px]">
                  {noteAuthor(note)} ·{" "}
                  {formatDate(zonedDateKey(new Date(note.created_at), zone), locale)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 sm:mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="label">{t.dashboard.quick.label}</p>
          <p className="text-xs text-muted-strong">{t.dashboard.quick.subtitle}</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <Reveal key={link.route} delay={index * 0.06}>
                <button
                  type="button"
                  onClick={() => onNavigate(link.route)}
                  className="hover-lift sheen press rail group flex h-full w-full flex-col justify-between border border-line/80 bg-surface/45 p-5 text-left hover:border-navy/30 hover:bg-surface/75"
                >
                  <span className="flex items-start justify-between">
                    <Icon
                      size={16}
                      strokeWidth={1.4}
                      className="text-navy/70 transition-colors group-hover:text-ink"
                    />
                    <span aria-hidden="true" className="serial text-ember">
                      0{index + 1}
                    </span>
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
                        className="shrink-0 text-muted-strong transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-navy"
                      />
                    </span>
                    <span className="mt-1.5 block text-[11px] leading-relaxed text-muted-strong">
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

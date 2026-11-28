import { motion } from "framer-motion";
import { Bookmark, Loader2, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { EnvelopeIntro } from "../components/EnvelopeIntro";
import { LetterCard } from "../components/LetterCard";
import { LetterEditor } from "../components/LetterEditor";
import { LetterReader } from "../components/LetterReader";
import { Plate } from "../components/Plate";
import { SectionHeader } from "../components/SectionHeader";
import { art } from "../data/art";
import { letters as keptLetters } from "../data/letters";
import { storageKeys } from "../data/site";
import { useAuth } from "../hooks/useAuth";
import { useFavorites } from "../hooks/useFavorites";
import { useLanguage } from "../hooks/useLanguage";
import { useLetters } from "../hooks/useLetters";
import type { Letter, LetterCategory } from "../types";

type Filter = "all" | LetterCategory;

/** Long enough to skip a keystroke, short enough to feel immediate. */
const SEARCH_DELAY_MS = 200;

export function Letters() {
  const { t } = useLanguage();
  const { userId } = useAuth();
  const { added, hidden, loading, error, refresh, addLetter, editLetter, deleteLetter } =
    useLetters();
  const favorites = useFavorites();

  const [filter, setFilter] = useState<Filter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [needle, setNeedle] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [introId, setIntroId] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [editing, setEditing] = useState<Letter | null>(null);

  // Typing filters after a beat, not on every character.
  useEffect(() => {
    const timer = window.setTimeout(() => setNeedle(query.trim().toLowerCase()), SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  // The letters kept in the repository come first; anything written in the app
  // is added to the same shelf, newest first.
  const sorted = useMemo(
    () =>
      [...keptLetters, ...added]
        .filter((letter) => !hidden.has(letter.id))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [added, hidden],
  );

  const searching = needle.length > 0;

  const visible = useMemo(
    () =>
      sorted.filter((letter) => {
        if (filter !== "all" && letter.category !== filter) return false;
        if (favoritesOnly && !favorites.ids.has(letter.id)) return false;
        if (!needle) return true;
        // Titles, words and collection names — in every language the letter holds.
        const haystack = [
          ...Object.values(letter.title),
          ...Object.values(letter.content),
          t.letters.categories[letter.category],
          letter.category,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      }),
    [sorted, filter, favoritesOnly, favorites.ids, needle, t.letters.categories],
  );

  /** One running number per letter, across the year headings. */
  const numbers = useMemo(() => {
    const map = new Map<string, number>();
    visible.forEach((letter, index) => map.set(letter.id, index + 1));
    return map;
  }, [visible]);

  const groups = useMemo(() => {
    const byYear = new Map<string, Letter[]>();
    for (const letter of visible) {
      const year = letter.date.slice(0, 4);
      const bucket = byYear.get(year);
      if (bucket) bucket.push(letter);
      else byYear.set(year, [letter]);
    }
    return [...byYear.entries()];
  }, [visible]);

  const active = sorted.find((letter) => letter.id === openId) ?? null;
  const reading = visible.length > 0 ? visible : sorted;
  const readingIndex = active ? reading.findIndex((letter) => letter.id === active.id) : -1;

  const showLetter = useCallback((id: string) => {
    let openedBefore = false;
    try {
      openedBefore = window.sessionStorage.getItem(storageKeys.letterEnvelope) === "1";
    } catch {
      // Storage blocked: the envelope simply opens every time.
    }
    if (openedBefore) setOpenId(id);
    else setIntroId(id);
  }, []);

  const finishIntro = useCallback(() => {
    const pending = introId;
    try {
      window.sessionStorage.setItem(storageKeys.letterEnvelope, "1");
    } catch {
      // Nothing to remember; the animation is harmless either way.
    }
    setIntroId(null);
    if (pending) setOpenId(pending);
  }, [introId]);

  const openLetter = useCallback(
    (id: string) => {
      showLetter(id);
    },
    [showLetter],
  );

  const step = (delta: number) => {
    if (!active || readingIndex < 0) return;
    const next = reading[readingIndex + delta];
    if (next) openLetter(next.id);
  };

  const closeActive = () => setOpenId(null);

  const startEditing = (letter: Letter) => {
    setOpenId(null);
    setEditing(letter);
  };

  const clearSearch = () => setQuery("");

  const resetAll = () => {
    setQuery("");
    setNeedle("");
    setFilter("all");
    setFavoritesOnly(false);
  };

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: t.letters.all, count: sorted.length },
    ...(Object.keys(t.letters.categories) as LetterCategory[]).map((key) => ({
      key,
      label: t.letters.categories[key],
      count: sorted.filter((letter) => letter.category === key).length,
    })),
  ];

  const narrowed = searching || filter !== "all" || favoritesOnly;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <SectionHeader
        eyebrow={t.letters.eyebrow}
        title={t.letters.title}
        jp="手紙"
        description={t.letters.description}
        aside={<span className="label">{t.letters.count(sorted.length)}</span>}
      />

      {/* The tray: a search line, the shelf of bookmarks, and the pen. */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-line/80 pb-4">
        <div className="relative w-full max-w-md">
          <label htmlFor="letter-search" className="sr-only">
            {t.letters.searchLabel}
          </label>
          <Search
            size={13}
            strokeWidth={1.5}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-strong"
          />
          <input
            id="letter-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.letters.searchPlaceholder}
            className="w-full rounded-full border border-line/80 bg-surface/70 py-2.5 pl-9 pr-11 text-base text-ink outline-none transition-colors placeholder:text-muted-strong/70 focus:border-plum/60 sm:text-sm"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label={t.letters.searchClear}
              className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted-strong transition-colors hover:text-ink"
            >
              <X size={14} strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setFavoritesOnly((current) => !current)}
            aria-pressed={favoritesOnly}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
              favoritesOnly
                ? "border-plum bg-plum/10 text-plum"
                : "border-line/80 text-navy/65 hover:border-plum/40 hover:text-plum"
            }`}
          >
            <Bookmark
              size={12}
              strokeWidth={1.5}
              aria-hidden="true"
              fill={favoritesOnly ? "currentColor" : "none"}
            />
            {t.letters.favoritesOnly}
            <span className="tabular-nums text-[8px] opacity-70">
              {String(favorites.ids.size).padStart(2, "0")}
            </span>
          </button>

          <Plate
            src={art.scarf}
            caption="you, looking away."
            tilt="2deg"
            tape
            className="hidden w-24 xl:block"
          />

          <button
            type="button"
            onClick={() => setWriting(true)}
            className="press inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-plum/50 px-5 font-mono text-[10px] uppercase tracking-[0.18em] text-navy transition-colors hover:bg-navy hover:text-mist"
          >
            <Plus size={12} strokeWidth={1.5} aria-hidden="true" />
            {t.letters.add}
          </button>
        </div>
      </div>

      {/* Collections read as index tabs, each with its count. */}
      <div
        className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2"
        role="group"
        aria-label={t.letters.all}
      >
        {filters.map((item) => {
          const isActive = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={isActive}
              className={`group relative inline-flex min-h-9 items-baseline gap-1.5 pb-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                isActive ? "text-ink" : "text-navy/55 hover:text-navy"
              }`}
            >
              {item.label}
              <span className={`text-[8px] ${isActive ? "text-plum" : "text-muted-strong"}`}>
                {String(item.count).padStart(2, "0")}
              </span>
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 -bottom-[5px] h-px origin-left bg-navy transition-transform duration-300 ${
                  isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </button>
          );
        })}
      </div>

      {narrowed && !loading && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="label text-[9px]">
            {t.letters.filtered(visible.length)}
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="font-mono text-[9px] uppercase tracking-[0.16em] text-navy/60 underline decoration-line underline-offset-4 transition-colors hover:text-ink"
          >
            {t.letters.searchClear}
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-line/80 bg-surface/40 px-4 py-3"
        >
          <p className="text-[12px] text-muted-strong">{t.letters.loadError}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex min-h-9 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-navy underline decoration-line underline-offset-4 hover:text-ink"
          >
            <Loader2 size={11} strokeWidth={1.5} aria-hidden="true" />
            {t.letters.retry}
          </button>
        </div>
      )}

      {favorites.error && (
        <p role="alert" className="mt-4 text-[11px] text-ember">
          {t.letters.favoriteError}
        </p>
      )}

      {loading ? (
        <div className="mt-8 space-y-3" aria-hidden="true">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-32 animate-pulse border border-line/60 bg-surface/30" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8">
          {narrowed ? (
            <div className="space-y-4">
              <EmptyState title={t.letters.searchEmpty} hint={t.letters.searchEmptyHint} />
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={resetAll}
                  className="press inline-flex min-h-11 items-center rounded-full border border-line/80 px-6 font-mono text-[10px] uppercase tracking-[0.18em] text-navy transition-colors hover:border-plum/50 hover:bg-lavender/40"
                >
                  {t.letters.searchClear}
                </button>
              </div>
            </div>
          ) : favoritesOnly ? (
            <EmptyState title={t.letters.noFavorites} hint={t.letters.noFavoritesHint} />
          ) : (
            <EmptyState title={t.letters.empty} hint={t.letters.emptyHint} />
          )}
        </div>
      ) : (
        <motion.div
          key={`${filter}-${favoritesOnly}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {groups.map(([year, items]) => (
            <section key={year} className="mt-8" aria-label={year}>
              <div className="flex items-baseline gap-4">
                <h2 className="font-display text-xl leading-none text-navy/80">{year}</h2>
                <span aria-hidden="true" className="h-px flex-1 bg-line/70" />
                <span className="serial">{String(items.length).padStart(2, "0")}</span>
              </div>

              <ol className="mt-4 space-y-3">
                {items.map((letter) => (
                  <li key={letter.id}>
                    <LetterCard
                      letter={letter}
                      number={numbers.get(letter.id) ?? 1}
                      onOpen={() => openLetter(letter.id)}
                      isFavorite={favorites.isFavorite(letter.id)}
                      onToggleFavorite={() => void favorites.toggle(letter.id)}
                    />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </motion.div>
      )}

      {active && (
        <LetterReader
          key={active.id}
          letter={active}
          position={{ index: Math.max(1, readingIndex + 1), total: reading.length }}
          onClose={closeActive}
          onPrevious={readingIndex > 0 ? () => step(-1) : undefined}
          onNext={readingIndex >= 0 && readingIndex < reading.length - 1 ? () => step(1) : undefined}
          isFavorite={favorites.isFavorite(active.id)}
          onToggleFavorite={() => void favorites.toggle(active.id)}
          canEdit={Boolean(active.added && active.authorId === userId)}
          canDelete={!active.added || active.authorId === userId}
          onEdit={() => startEditing(active)}
          onDelete={() => deleteLetter(active)}
        />
      )}

      {introId && <EnvelopeIntro onDone={finishIntro} />}

      {writing && <LetterEditor onClose={() => setWriting(false)} onSave={addLetter} />}

      {editing && (
        <LetterEditor
          letter={editing}
          onClose={() => setEditing(null)}
          onSave={(draft) => editLetter(editing.id, draft)}
        />
      )}
    </div>
  );
}

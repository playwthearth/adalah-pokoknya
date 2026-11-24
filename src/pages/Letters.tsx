import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { LetterCard } from "../components/LetterCard";
import { Modal } from "../components/Modal";
import { SectionHeader } from "../components/SectionHeader";
import { letters } from "../data/letters";
import { useLanguage } from "../hooks/useLanguage";
import type { LetterCategory } from "../types";
import { formatDate } from "../utils/format";

type Filter = "all" | LetterCategory;

export function Letters() {
  const { t, language, locale } = useLanguage();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...letters].sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );

  const visible = useMemo(
    () => (filter === "all" ? sorted : sorted.filter((letter) => letter.category === filter)),
    [filter, sorted],
  );

  const active = sorted.find((letter) => letter.id === openId) ?? null;
  const closeActive = () => setOpenId(null);

  const filters: { key: Filter; label: string; count: number }[] = [
    {
      key: "all",
      label: t.letters.all,
      count: sorted.length,
    },
    ...(Object.keys(t.letters.categories) as LetterCategory[]).map((key) => ({
      key,
      label: t.letters.categories[key],
      count: sorted.filter((letter) => letter.category === key).length,
    })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <SectionHeader
        eyebrow={t.letters.eyebrow}
        title={t.letters.title}
        jp="手紙"
        description={t.letters.description}
        aside={<span className="label">{t.letters.count(sorted.length)}</span>}
      />

      <div className="mt-7 flex flex-wrap gap-2">
        {filters.map((item) => {
          const isActive = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={isActive}
              className={`inline-flex min-h-11 items-center gap-2 border px-3.5 py-2 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                isActive
                  ? "border-navy bg-navy text-mist"
                  : "border-line/80 bg-transparent text-navy/70 hover:border-navy/35 hover:text-ink"
              }`}
            >
              {item.label}
              <span
                className={`font-mono text-[9px] ${
                  isActive ? "text-mist/60" : "text-muted-strong"
                }`}
              >
                {String(item.count).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={filter}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10"
      >
        {visible.length === 0 ? (
          <EmptyState title={t.letters.empty} hint={t.letters.emptyHint} />
        ) : (
          <div className="border-b border-line/70">
            {visible.map((letter, index) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                index={index}
                onOpen={() => setOpenId(letter.id)}
              />
            ))}
          </div>
        )}
      </motion.div>

      <Modal
        open={active !== null}
        onClose={closeActive}
        label={active ? active.title[language] : t.letters.title}
        closeLabel={t.common.close}
      >
        {active && (
          <article className="px-6 pb-10 pt-14 sm:px-12 sm:pb-14 sm:pt-16">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="label flex items-center gap-2">
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ember/80" />
                {t.letters.categories[active.category]}
              </span>
              <span aria-hidden="true" className="h-px w-5 bg-line" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-strong">
                {formatDate(active.date, locale)}
              </span>
            </div>

            <h2 className="mt-5 font-display text-3xl font-extralight leading-tight text-ink sm:text-4xl">
              {active.title[language]}
            </h2>

            <div className="mt-7 space-y-4 border-t border-line/70 pt-7">
              {active.content[language]
                .split(/\n{2,}/)
                .map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-[14px] leading-[1.95] text-navy/85 [text-wrap:pretty]"
                  >
                    {paragraph}
                  </p>
                ))}
            </div>

            <div className="mt-9 flex items-center gap-3 border-t border-line/70 pt-5">
              <span aria-hidden="true" className="h-px w-8 bg-ember/70" />
              <p className="label">{t.letters.from}</p>
              <span className="text-[11px] tracking-[0.2em] text-muted-strong font-display italic">
                {t.letters.signoff}
              </span>
            </div>

            <p className="label mt-6 text-[9px] text-muted-strong">{t.letters.hint}</p>
          </article>
        )}
      </Modal>
    </div>
  );
}

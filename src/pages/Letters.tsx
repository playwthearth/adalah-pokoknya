import { motion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { LetterCard } from "../components/LetterCard";
import { LetterEditor } from "../components/LetterEditor";
import { Modal } from "../components/Modal";
import { Plate } from "../components/Plate";
import { SectionHeader } from "../components/SectionHeader";
import { art } from "../data/art";
import { letters as keptLetters } from "../data/letters";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useLetters } from "../hooks/useLetters";
import type { Letter, LetterCategory } from "../types";
import { formatDate } from "../utils/format";

type Filter = "all" | LetterCategory;

export function Letters() {
  const { t, language, locale } = useLanguage();
  const { userId } = useAuth();
  const { added, error, refresh, addLetter, editLetter, deleteLetter } = useLetters();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [editing, setEditing] = useState<Letter | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  // The letters kept in the repository come first; anything written in the app
  // is added to the same shelf.
  const sorted = useMemo(
    () => [...keptLetters, ...added].sort((a, b) => b.date.localeCompare(a.date)),
    [added],
  );

  const visible = useMemo(
    () => (filter === "all" ? sorted : sorted.filter((letter) => letter.category === filter)),
    [filter, sorted],
  );

  const active = sorted.find((letter) => letter.id === openId) ?? null;

  const openLetter = (id: string) => {
    setConfirmDelete(false);
    setDeleteError(false);
    setOpenId(id);
  };

  const closeActive = () => {
    setOpenId(null);
    setConfirmDelete(false);
    setDeleteError(false);
  };

  const startEditing = (letter: Letter) => {
    setConfirmDelete(false);
    setDeleteError(false);
    setOpenId(null);
    setEditing(letter);
  };

  const removeActive = async () => {
    if (!active) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleteError(false);
    try {
      await deleteLetter(active.id);
      closeActive();
    } catch (failure) {
      console.error("[letters] delete failed", failure);
      setDeleteError(true);
    }
  };

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

  const addButton = (
    <button
      type="button"
      onClick={() => setWriting(true)}
      className="press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-plum/50 px-5 font-mono text-[10px] uppercase tracking-[0.18em] text-navy transition-colors hover:bg-navy hover:text-mist sm:w-auto"
    >
      <Plus size={12} strokeWidth={1.5} aria-hidden="true" />
      {t.letters.add}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <SectionHeader
        eyebrow={t.letters.eyebrow}
        title={t.letters.title}
        jp="手紙"
        description={t.letters.description}
        aside={<span className="label">{t.letters.count(sorted.length)}</span>}
      />

      <div className="mt-7 flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => {
            const isActive = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={isActive}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  isActive
                    ? "border-navy bg-navy text-mist"
                    : "border-line/80 bg-transparent text-navy/70 hover:border-plum/40 hover:text-ink"
                }`}
              >
                {item.label}
                <span
                  className={`font-mono text-[9px] ${
                    isActive ? "text-mist/70" : "text-muted-strong"
                  }`}
                >
                  {String(item.count).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-4">
          <Plate
            src={art.scarf}
            caption="you, looking away."
            tilt="2deg"
            tape
            className="hidden w-28 shrink-0 sm:block sm:w-36"
          />
          {addButton}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-[11px] text-muted-strong">
          {t.letters.loadError}{" "}
          <button
            type="button"
            onClick={() => void refresh()}
            className="underline decoration-line underline-offset-4 transition-colors hover:text-ink"
          >
            {t.letters.retry}
          </button>
        </p>
      )}

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
          <div className="space-y-4">
            {visible.map((letter, index) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                index={index}
                onOpen={() => openLetter(letter.id)}
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

            <h2 className="mt-4 font-display text-3xl leading-tight text-ink sm:text-[2.4rem]">
              {active.title[language]}
            </h2>

            {active.image && (
              <figure className="polaroid mt-7 max-w-md">
                <img
                  src={active.image}
                  alt={t.letters.photoAlt}
                  loading="lazy"
                  decoding="async"
                  className="block max-h-[52vh] w-full object-cover"
                />
              </figure>
            )}

            <span aria-hidden="true" className="mt-7 block h-px w-16 bg-gradient-to-r from-periwinkle to-transparent" />

            <div className="mt-6 space-y-4">
              {active.content[language]
                .split(/\n{2,}/)
                .map((paragraph, index) => (
                  <p
                    key={index}
                    className="letter-body text-[1.1rem] leading-[1.95] text-navy/90 [text-wrap:pretty]"
                  >
                    {paragraph}
                  </p>
                ))}
            </div>

            <div aria-hidden="true" className="mt-9 flex items-center gap-3 text-periwinkle">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-periwinkle/70" />
              <span className="h-1.5 w-1.5 rotate-45 bg-periwinkle/80" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-periwinkle/70" />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <p className="label">{t.letters.from}</p>
              <span className="font-serif text-[15px] italic tracking-[0.06em] text-plum">
                {t.letters.signoff}
              </span>
            </div>

            <p className="caption mt-6 text-[15px] text-muted-strong">{t.letters.hint}</p>

            {active.added && active.authorId === userId && (
              <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-line/70 pt-5">
                <button
                  type="button"
                  onClick={() => startEditing(active)}
                  className="btn-quiet inline-flex min-h-11 items-center gap-2 px-3 text-[9px] uppercase tracking-[0.14em]"
                >
                  <Pencil size={11} strokeWidth={1.5} aria-hidden="true" />
                  {t.letters.edit}
                </button>
                <button
                  type="button"
                  onClick={() => void removeActive()}
                  className={`btn-quiet inline-flex min-h-11 items-center gap-2 px-3 text-[9px] uppercase tracking-[0.14em] ${
                    confirmDelete ? "text-ember" : ""
                  }`}
                >
                  <Trash2 size={11} strokeWidth={1.5} aria-hidden="true" />
                  {confirmDelete ? t.letters.confirmDelete : t.letters.delete}
                </button>
              </div>
            )}

            {deleteError && (
              <p role="alert" className="mt-3 text-right text-[11px] text-ember">
                {t.letters.deleteError}
              </p>
            )}
          </article>
        )}
      </Modal>

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

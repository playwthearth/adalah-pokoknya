import { motion } from "framer-motion";
import { ArrowUpRight, Loader2, Pencil, Search, Send, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { SectionHeader } from "../components/SectionHeader";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useMyName, useNoteAuthorName } from "../hooks/useNoteAuthorName";
import { useNotes } from "../hooks/useNotes";
import { useSettings } from "../hooks/useSettings";
import type { Note, NoteKind } from "../types";
import { formatDate, zonedDateKey, zonedParts } from "../utils/format";

const MAX_LENGTH = 1200;

/** All notes, or one of the two kinds the database actually stores. */
type Filter = "all" | NoteKind;

/** True when a daily note will disappear at the next midnight in the shared zone. */
function fadesTonight(note: Note, timeZone: string): boolean {
  if (note.kind !== "daily") return false;
  const parts = zonedParts(new Date(note.created_at), timeZone);
  if (!parts) return false;
  return parts.hour >= 18;
}

export function Notes() {
  const { t, locale } = useLanguage();
  const { userId } = useAuth();
  const myName = useMyName();
  const authorName = useNoteAuthorName();
  const {
    notes,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    error,
    refresh,
    addNote,
    updateNote,
    removeNote,
  } = useNotes();
  const { settings } = useSettings();

  const [kind, setKind] = useState<NoteKind>("daily");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const [posted, setPosted] = useState(false);
  /** Whether the last confirmation was a save of an edit, not a new note. */
  const [postedEdit, setPostedEdit] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const confirmTimeoutRef = useRef<number | null>(null);

  const cancelConfirm = useCallback(() => {
    if (confirmTimeoutRef.current !== null) {
      window.clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = null;
    }
    setConfirmId(null);
  }, []);

  const armConfirm = useCallback((id: string) => {
    if (confirmTimeoutRef.current !== null) {
      window.clearTimeout(confirmTimeoutRef.current);
    }
    setConfirmId(id);
    confirmTimeoutRef.current = window.setTimeout(() => {
      setConfirmId((current) => (current === id ? null : current));
      confirmTimeoutRef.current = null;
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current !== null) {
        window.clearTimeout(confirmTimeoutRef.current);
      }
    };
  }, []);

  const startEdit = useCallback(
    (note: Note) => {
      setEditingId(note.id);
      setKind(note.kind);
      setBody(note.body);
      setOpenId(null);
      cancelConfirm();
      document.getElementById("note-composer")?.scrollIntoView({ behavior: "smooth" });
    },
    [cancelConfirm],
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setBody("");
    setKind("daily");
    setUpdateError(false);
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (filter !== "all" && note.kind !== filter) return false;
      if (!needle) return true;
      return (
        note.body.toLowerCase().includes(needle) ||
        authorName(note).toLowerCase().includes(needle)
      );
    });
  }, [notes, filter, query, authorName]);

  const open = notes.find((note) => note.id === openId) ?? null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim() || posting) return;
    setPosting(true);
    setPostError(false);
    setUpdateError(false);
    setPosted(false);
    const wasEditing = editingId !== null;
    try {
      if (editingId) {
        await updateNote(editingId, { kind, body, authorName: myName });
        setEditingId(null);
      } else {
        await addNote({ kind, body, authorName: myName });
      }
      setBody("");
      setPostedEdit(wasEditing);
      setPosted(true);
      window.setTimeout(() => setPosted(false), 3200);
    } catch {
      if (editingId) {
        setUpdateError(true);
      } else {
        setPostError(true);
      }
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id: string) => {
    setDeleteError(false);
    cancelConfirm();
    try {
      await removeNote(id);
      setOpenId(null);
    } catch {
      setDeleteError(true);
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t.notes.filterAll },
    { key: "daily", label: t.notes.kindDaily },
    { key: "love", label: t.notes.kindLove },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <SectionHeader
        eyebrow={t.notes.eyebrow}
        title={t.notes.title}
        jp="便り"
        description={t.notes.description}
        aside={<span className="label">{t.notes.count(notes.length)}</span>}
      />

      <section
        className="surface mt-9 scroll-mt-24 p-6 sm:p-8"
        id="note-composer"
        aria-label={t.notes.composerTitle}
      >
        <form onSubmit={submit}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {editingId ? (
              <div className="flex items-center gap-3">
                <p className="label flex items-center gap-2 text-ember">
                  <span aria-hidden="true" className="signal-dot h-1.5 w-1.5 rounded-full bg-ember" />
                  {t.notes.editingNote}
                </p>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn-quiet inline-flex min-h-9 items-center gap-1.5 px-2 text-[9px] uppercase tracking-[0.14em]"
                >
                  <X size={11} strokeWidth={1.5} aria-hidden="true" />
                  {t.notes.cancelEdit}
                </button>
              </div>
            ) : (
              <p className="label">{t.notes.composerTitle}</p>
            )}
            <div className="flex flex-wrap gap-2" role="group" aria-label={t.notes.composerTitle}>
              {(["daily", "love"] as const).map((option) => {
                const active = kind === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setKind(option)}
                    aria-pressed={active}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[9px] uppercase tracking-[0.16em] transition-colors ${
                      active
                        ? "border-navy bg-navy text-mist"
                        : "border-line/80 text-navy/70 hover:border-plum/40 hover:text-ink"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1 w-1 rounded-full ${
                        option === "love" ? "bg-ember" : "bg-cyan"
                      }`}
                    />
                    {option === "daily" ? t.notes.kindDaily : t.notes.kindLove}
                  </button>
                );
              })}
            </div>
          </div>

          <label htmlFor="note-body" className="sr-only">
            {t.notes.composerTitle}
          </label>
          <textarea
            id="note-body"
            required
            rows={4}
            maxLength={MAX_LENGTH}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t.notes.placeholder}
            aria-describedby="note-composer-meta"
            className="mt-5 w-full resize-y border-0 border-b border-line bg-transparent py-3 text-base leading-relaxed text-ink outline-none transition-colors placeholder:text-muted-strong/70 focus:border-navy"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p id="note-composer-meta" className="label text-[9px]">
              {t.notes.remaining(MAX_LENGTH - body.length)}
              {kind === "daily" && <> · {t.notes.dailyExpiry}</>}
            </p>
            <div className="flex items-center gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn-quiet inline-flex min-h-11 items-center gap-1.5 px-4 text-[10px] uppercase tracking-[0.16em]"
                >
                  {t.notes.cancelEdit}
                </button>
              )}
              <button
                type="submit"
                disabled={posting || !body.trim()}
                className="press inline-flex min-h-11 items-center gap-2 rounded-full border border-navy bg-navy px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-mist transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                {posting ? t.notes.posting : editingId ? t.notes.saveChanges : t.notes.post}
                <Send size={12} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>

          {postError && (
            <p role="alert" className="mt-3 text-[11px] text-ember">
              {t.notes.postError}
            </p>
          )}
          {updateError && (
            <p role="alert" className="mt-3 text-[11px] text-ember">
              {t.notes.updateError}
            </p>
          )}
          {posted && (
            <p role="status" className="mt-3 text-[11px] text-muted-strong">
              {postedEdit ? t.notes.updated : t.notes.posted}
            </p>
          )}
        </form>
      </section>

      <section className="mt-12" aria-label={t.notes.latest}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="label">{t.notes.latest}</p>
          <span className="font-mono text-[10px] tabular-nums tracking-[0.16em] text-muted-strong">
            {filter === "all" && !query.trim()
              ? String(notes.length).padStart(2, "0")
              : t.notes.filtered(visible.length)}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.notes.latest}>
            {filters.map((item) => {
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    cancelConfirm();
                    setFilter(item.key);
                  }}
                  aria-pressed={active}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 py-2 text-[9px] uppercase tracking-[0.16em] transition-colors ${
                    active
                      ? "border-navy bg-navy text-mist"
                      : "border-line/80 text-navy/70 hover:border-plum/40 hover:text-ink"
                  }`}
                >
                  {item.label}
                  <span
                    className={`font-mono text-[9px] ${
                      active ? "text-mist/70" : "text-muted-strong"
                    }`}
                  >
                    {item.key === "all"
                      ? String(notes.length).padStart(2, "0")
                      : String(notes.filter((note) => note.kind === item.key).length).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:max-w-[240px]">
            <label htmlFor="note-search" className="sr-only">
              {t.notes.searchLabel}
            </label>
            <Search
              size={13}
              strokeWidth={1.5}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-strong"
            />
            <input
              id="note-search"
              type="search"
              value={query}
              onChange={(event) => {
                cancelConfirm();
                setQuery(event.target.value);
              }}
              placeholder={t.notes.searchPlaceholder}
              className="w-full rounded-full border border-line/80 bg-surface/70 py-2 pl-9 pr-4 text-base text-ink outline-none transition-colors placeholder:text-muted-strong/70 focus:border-plum/60 sm:text-sm"
            />
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {t.notes.filtered(visible.length)}
        </p>

        {loading ? (
          <div className="mt-4 space-y-3" aria-hidden="true">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-24 animate-pulse border border-line/60 bg-surface/30" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-4 border border-line/80 bg-surface/30 p-6">
            <p className="text-[13px] text-muted-strong">{t.notes.loadError}</p>
            <button type="button" onClick={() => void refresh()} className="btn-quiet mt-3 min-h-11">
              <Loader2 size={12} strokeWidth={1.5} aria-hidden="true" />
              {t.notes.retry}
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="mt-4">
            <EmptyState title={t.notes.empty} hint={t.notes.emptyHint} />
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-4">
            <EmptyState title={t.notes.searchEmpty} hint={t.notes.emptyHint} />
          </div>
        ) : (
          <ol className="mt-4 space-y-3">
            {visible.map((note, index) => (
              <motion.li
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.5,
                  delay: Math.min(index, 6) * 0.045,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rail group grid gap-3 rounded-[6px] border border-line/70 bg-surface/80 px-4 py-5 transition-colors duration-500 hover:border-cyan/70 hover:bg-surface sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-8 sm:px-6 sm:py-6"
              >
                <div className="flex items-start justify-between gap-3 sm:block">
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
                    <p className="label mt-2 text-[9px]">
                      {formatDate(
                        zonedDateKey(new Date(note.created_at), settings.timezone),
                        locale,
                      )}
                    </p>
                    {fadesTonight(note, settings.timezone) && (
                      <p className="label mt-2 text-[9px] text-ember">{t.notes.fadesTonight}</p>
                    )}
                  </div>

                  {note.author_id === userId && (
                    <div className="flex flex-wrap items-center gap-2 sm:mt-4">
                      <button
                        type="button"
                        onClick={() => startEdit(note)}
                        className="btn-quiet min-h-11 px-3 text-[9px]"
                      >
                        <Pencil size={11} strokeWidth={1.5} aria-hidden="true" />
                        {t.notes.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          confirmId === note.id ? void remove(note.id) : armConfirm(note.id)
                        }
                        className={`btn-quiet min-h-11 px-3 text-[9px] ${
                          confirmId === note.id ? "text-ember" : ""
                        }`}
                      >
                        <Trash2 size={11} strokeWidth={1.5} aria-hidden="true" />
                        {confirmId === note.id ? t.notes.confirmDelete : t.notes.delete}
                      </button>
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="letter-body line-clamp-4 whitespace-pre-wrap text-[1.05rem] leading-[1.9] text-navy/90">
                    {note.body}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="label text-[9px]">{authorName(note)}</p>
                    <button
                      type="button"
                      onClick={() => setOpenId(note.id)}
                      aria-label={`${t.notes.openNote}: ${authorName(note)}`}
                      className="btn-quiet min-h-11 px-3 text-[9px]"
                    >
                      {t.notes.openNote}
                      <ArrowUpRight size={11} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        )}

        {hasMore && !query.trim() && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="press inline-flex min-h-11 items-center gap-2 rounded-full border border-line/80 px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-navy hover:border-plum/50 hover:bg-lavender/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingMore && <Loader2 size={12} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
              {loadingMore ? t.notes.loadingEarlier : t.notes.loadEarlier}
            </button>
          </div>
        )}

        {deleteError && (
          <p role="alert" className="mt-3 text-[11px] text-ember">
            {t.notes.deleteError}
          </p>
        )}
      </section>

      <Modal
        open={open !== null}
        onClose={() => {
          cancelConfirm();
          setOpenId(null);
        }}
        label={open ? authorName(open) : t.notes.title}
        closeLabel={t.common.close}
        labelledBy="note-detail-title"
      >
        {open && (
          <article className="px-6 pb-10 pt-14 sm:px-12 sm:pb-14 sm:pt-16">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="label flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`h-1 w-1 rounded-full ${
                    open.kind === "love" ? "bg-ember" : "bg-cyan"
                  }`}
                />
                {open.kind === "love" ? t.notes.kindLove : t.notes.kindDaily}
              </span>
              <span aria-hidden="true" className="h-px w-5 bg-line" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-strong">
                {formatDate(zonedDateKey(new Date(open.created_at), settings.timezone), locale)}
              </span>
              {fadesTonight(open, settings.timezone) && (
                <span className="label text-ember">{t.notes.fadesTonight}</span>
              )}
            </div>

            <h2
              id="note-detail-title"
              className="mt-4 font-display text-3xl leading-tight text-ink sm:text-[2.4rem]"
            >
              {authorName(open)}
            </h2>

            <p className="letter-body mt-6 whitespace-pre-wrap border-t border-line/70 pt-6 text-[1.1rem] leading-[1.95] text-navy/90 [text-wrap:pretty]">
              {open.body}
            </p>

            {open.author_id === userId && (
              <div className="mt-9 flex items-center gap-3 border-t border-line/70 pt-5">
                <button
                  type="button"
                  onClick={() => startEdit(open)}
                  className="btn-quiet min-h-11 px-4 text-[9px]"
                >
                  <Pencil size={11} strokeWidth={1.5} aria-hidden="true" />
                  {t.notes.edit}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    confirmId === open.id ? void remove(open.id) : armConfirm(open.id)
                  }
                  className={`btn-quiet min-h-11 px-4 text-[9px] ${
                    confirmId === open.id ? "text-ember" : ""
                  }`}
                >
                  <Trash2 size={11} strokeWidth={1.5} aria-hidden="true" />
                  {confirmId === open.id ? t.notes.confirmDelete : t.notes.delete}
                </button>
              </div>
            )}
          </article>
        )}
      </Modal>
    </div>
  );
}

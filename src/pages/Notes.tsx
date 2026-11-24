import { motion } from "framer-motion";
import { Loader2, Send, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { EmptyState } from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useMyName, useNoteAuthorName } from "../hooks/useNoteAuthorName";
import { useNotes } from "../hooks/useNotes";
import { useSettings } from "../hooks/useSettings";
import type { NoteKind } from "../types";
import { formatDate, zonedDateKey } from "../utils/format";

const MAX_LENGTH = 1200;

export function Notes() {
  const { t, locale } = useLanguage();
  const { userId } = useAuth();
  const myName = useMyName();
  const authorName = useNoteAuthorName();
  const { notes, loading, error, refresh, addNote, removeNote } = useNotes();
  const { settings } = useSettings();

  const [kind, setKind] = useState<NoteKind>("daily");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(false);
  const [posted, setPosted] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim() || posting) return;
    setPosting(true);
    setPostError(false);
    setPosted(false);
    try {
      await addNote({
        kind,
        body,
        authorName: myName,
      });
      setBody("");
      setPosted(true);
      window.setTimeout(() => setPosted(false), 3200);
    } catch {
      setPostError(true);
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id: string) => {
    setDeleteError(false);
    try {
      await removeNote(id);
      setConfirmId(null);
    } catch {
      setDeleteError(true);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <SectionHeader
        eyebrow={t.notes.eyebrow}
        title={t.notes.title}
        jp="便り"
        description={t.notes.description}
        aside={<span className="label">{t.notes.count(notes.length)}</span>}
      />

      <section className="surface mt-9 p-6 sm:p-8" aria-label={t.notes.composerTitle}>
        <form onSubmit={submit}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="label">{t.notes.composerTitle}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t.notes.composerTitle}>
              {(["daily", "love"] as const).map((option) => {
                const active = kind === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setKind(option)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] transition-colors ${
                      active
                        ? "border-navy bg-navy text-mist"
                        : "border-line/80 text-navy/70 hover:border-navy/35 hover:text-ink"
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
            className="mt-5 w-full resize-y border-0 border-b border-line bg-transparent py-3 text-[14px] leading-relaxed text-ink outline-none transition-colors placeholder:text-muted-strong/60 focus:border-navy"
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="label text-[9px]">
              {t.notes.remaining(MAX_LENGTH - body.length)}
              {kind === "daily" && <> · {t.notes.dailyExpiry}</>}
            </p>
            <button
              type="submit"
              disabled={posting || !body.trim()}
              className="press inline-flex items-center gap-2 border border-navy/70 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-navy hover:border-navy hover:bg-navy hover:text-mist disabled:cursor-not-allowed disabled:opacity-50"
            >
              {posting ? t.notes.posting : t.notes.post}
              <Send size={12} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          {postError && (
            <p role="alert" className="mt-3 text-[11px] text-ember">
              {t.notes.postError}
            </p>
          )}
          {posted && (
            <p role="status" className="mt-3 text-[11px] text-muted-strong">
              {t.notes.posted}
            </p>
          )}
        </form>
      </section>

      <section className="mt-12" aria-label={t.notes.latest}>
        <div className="flex items-baseline justify-between gap-4">
          <p className="label">{t.notes.latest}</p>
          <span className="font-mono text-[10px] tabular-nums tracking-[0.16em] text-muted-strong">
            {String(notes.length).padStart(2, "0")}
          </span>
        </div>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="h-24 animate-pulse border border-line/60 bg-white/30"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mt-4 border border-line/80 bg-white/30 p-6">
            <p className="text-[13px] text-muted-strong">{t.notes.loadError}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="btn-quiet mt-3"
            >
              <Loader2 size={12} strokeWidth={1.5} />
              {t.notes.retry}
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="mt-4">
            <EmptyState title={t.notes.empty} hint={t.notes.emptyHint} />
          </div>
        ) : (
          <ol className="mt-2 border-b border-line/70">
            {notes.map((note, index) => (
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
                className="rail group -ml-3 grid gap-3 border-t border-line/70 py-6 pl-3 transition-colors duration-500 hover:border-line hover:bg-white/50 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-8"
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
                  </div>

                  {note.author_id === userId && (
                    <div className="sm:mt-4">
                      <button
                        type="button"
                        onClick={() =>
                          confirmId === note.id ? void remove(note.id) : setConfirmId(note.id)
                        }
                        className={`btn-quiet text-[9px] ${
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
                  <p className="whitespace-pre-wrap text-[14px] leading-[1.9] text-navy/90">
                    {note.body}
                  </p>
                  <p className="label mt-4 text-[9px]">{authorName(note)}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        )}

        {deleteError && (
          <p role="alert" className="mt-3 text-[11px] text-ember">
            {t.notes.deleteError}
          </p>
        )}
      </section>
    </div>
  );
}

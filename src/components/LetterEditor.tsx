import { Camera, Loader2, Plus, Search, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  decorGlyph,
  decorName,
  isHttpsUrl,
  MAX_DECOR,
  readDecor,
  STAMPS,
  STICKERS,
} from "../data/letterDecor";
import { storageKeys } from "../data/site";
import type { LetterDraft } from "../hooks/useLetters";
import { useAuth } from "../hooks/useAuth";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useLanguage } from "../hooks/useLanguage";
import { useSettings } from "../hooks/useSettings";
import { supabase } from "../lib/supabase";
import type { Letter, LetterCategory, LetterDecor } from "../types";
import { formatDate, zonedDateKey } from "../utils/format";
import { compressImage, MAX_IMAGE_BYTES } from "../utils/image";
import { DecorCollage, StampMark } from "./LetterDecor";

const MAX_BODY = 4000;
const CATEGORIES: LetterCategory[] = [
  "love",
  "birthday",
  "encouragement",
  "thoughts",
  "special",
];

const fieldClass =
  "w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-ink outline-none transition-colors placeholder:text-muted-strong focus:border-navy sm:text-sm";

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border px-4 text-[10px] uppercase tracking-[0.18em] transition-colors";

const photoActionClass = `${actionClass} w-full border-line text-navy/75 hover:border-navy/40 hover:text-ink disabled:opacity-60 sm:w-auto`;

interface GifResult {
  id: string;
  title: string;
  preview: string;
  url: string;
}

/** What is kept on this device between visits, before the letter is saved. */
interface StoredDraft {
  title: string;
  body: string;
  category: LetterCategory;
  date: string;
  decor: LetterDecor[];
  savedAt: string;
}

function readStoredDraft(key: string): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (typeof parsed.title !== "string" || typeof parsed.body !== "string") return null;
    if (!parsed.title.trim() && !parsed.body.trim()) return null;
    const category = CATEGORIES.includes(parsed.category as LetterCategory)
      ? (parsed.category as LetterCategory)
      : "love";
    const date =
      typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
        ? parsed.date
        : "";
    return {
      title: parsed.title.slice(0, 120),
      body: parsed.body.slice(0, MAX_BODY),
      category,
      date,
      decor: readDecor(parsed.decor),
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
    };
  } catch {
    return null;
  }
}

/** An editorial number beside a section of the sheet. */
function SectionMark({ index, children }: { index: string; children: ReactNode }) {
  return (
    <span className="label flex items-baseline gap-2">
      <span aria-hidden="true" className="serial text-plum/70">
        {index}
      </span>
      {children}
    </span>
  );
}

interface LetterEditorProps {
  /** The letter being changed, or null for a new one. */
  letter?: Letter | null;
  onClose: () => void;
  onSave: (draft: LetterDraft) => Promise<void>;
}

export function LetterEditor({ letter, onClose, onSave }: LetterEditorProps) {
  const { t, language, locale } = useLanguage();
  const { settings } = useSettings();
  const { userId } = useAuth();
  const editing = Boolean(letter);

  // One draft per person and per letter, so two sheets never overwrite each other.
  const [draftKey] = useState(
    () => `${storageKeys.letterDraft}.${userId ?? "local"}.${letter?.id ?? "new"}`,
  );
  const [restored] = useState(() => readStoredDraft(draftKey));
  const [draftNotice, setDraftNotice] = useState(Boolean(restored));

  const [title, setTitle] = useState(restored?.title ?? letter?.title.en ?? "");
  const [category, setCategory] = useState<LetterCategory>(
    restored?.category ?? letter?.category ?? "love",
  );
  const [date, setDate] = useState(
    () => restored?.date || letter?.date || zonedDateKey(new Date(), settings.timezone),
  );
  const [body, setBody] = useState(restored?.body ?? letter?.content.en ?? "");
  const [decor, setDecor] = useState<LetterDecor[]>(restored?.decor ?? letter?.decor ?? []);
  const [photo, setPhoto] = useState<File | null>(null);
  /** True when a photo the letter already had should be taken away. */
  const [removeExisting, setRemoveExisting] = useState(false);
  const [gifUrl, setGifUrl] = useState("");
  const [gifError, setGifError] = useState<string | null>(null);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<GifResult[]>([]);
  const [gifSearching, setGifSearching] = useState(false);
  const [gifNote, setGifNote] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The device or drive picker. */
  const fileInput = useRef<HTMLInputElement>(null);
  /** The camera, where the browser supports it; elsewhere this is the same picker. */
  const cameraInput = useRef<HTMLInputElement>(null);

  const sheetRef = useFocusTrap<HTMLDivElement>(true, () => {
    if (!busy) onClose();
  });

  const pickedUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  const existingUrl = removeExisting ? null : (letter?.image ?? null);
  const preview = pickedUrl ?? existingUrl;

  useEffect(() => {
    if (!pickedUrl) return;
    const url = pickedUrl;
    return () => URL.revokeObjectURL(url);
  }, [pickedUrl]);

  // The sheet covers the page, so the archive behind it must not scroll.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Unfinished words are kept on this device, so closing the sheet is never a
  // way to lose them. Saving the letter clears the copy.
  useEffect(() => {
    if (busy || preparing) return;
    const timer = window.setTimeout(() => {
      try {
        if (!title.trim() && !body.trim()) {
          window.localStorage.removeItem(draftKey);
          return;
        }
        const stored: StoredDraft = {
          title,
          body,
          category,
          date,
          decor,
          savedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(draftKey, JSON.stringify(stored));
      } catch {
        // Storage may be blocked; the sheet still works, it just cannot restore.
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [busy, preparing, draftKey, title, body, category, date, decor]);

  const clearStoredDraft = () => {
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // Nothing kept, nothing to clear.
    }
  };

  const startOver = () => {
    setTitle(letter?.title.en ?? "");
    setBody(letter?.content.en ?? "");
    setCategory(letter?.category ?? "love");
    setDate(letter?.date ?? zonedDateKey(new Date(), settings.timezone));
    setDecor(letter?.decor ?? []);
    setPhoto(null);
    setRemoveExisting(false);
    setDraftNotice(false);
    clearStoredDraft();
  };

  const choosePhoto = async (file: File | null) => {
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
      setPhotoError(t.letters.photoError);
      return;
    }
    setPreparing(true);
    try {
      setPhoto(await compressImage(file));
      setRemoveExisting(false);
    } finally {
      setPreparing(false);
    }
  };

  const clearPhoto = () => {
    setPhotoError(null);
    if (photo) setPhoto(null);
    else setRemoveExisting(true);
  };

  // Stamps and stickers toggle; a second tap takes the piece off again.
  const toggleDecor = (item: LetterDecor) => {
    setGifError(null);
    setDecor((current) => {
      const existing = current.findIndex(
        (entry) => entry.kind === item.kind && entry.value === item.value,
      );
      if (existing >= 0) return current.filter((_, index) => index !== existing);
      if (current.length >= MAX_DECOR) return current;
      return [...current, item];
    });
  };

  const addGifUrl = (url: string) => {
    if (decor.length >= MAX_DECOR) {
      setGifError(t.letters.decorFull);
      return;
    }
    setDecor((current) =>
      current.length >= MAX_DECOR || current.some((item) => item.value === url)
        ? current
        : [...current, { kind: "gif", value: url }],
    );
    setGifError(null);
  };

  const addGif = () => {
    const url = gifUrl.trim();
    if (!isHttpsUrl(url)) {
      setGifError(t.letters.gifInvalid);
      return;
    }
    addGifUrl(url);
    setGifUrl("");
  };

  // Search is answered by /api/gif-search, which holds the Giphy key.
  const searchGifs = async () => {
    const query = gifQuery.trim();
    if (!query || gifSearching) return;
    setGifNote(null);
    setGifSearching(true);
    try {
      if (!supabase) {
        setGifNote(t.letters.gifSearchSignedOut);
        return;
      }
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setGifNote(t.letters.gifSearchSignedOut);
        return;
      }

      const response = await fetch(`/api/gif-search?q=${encodeURIComponent(query)}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (response.status === 503 || response.status === 404) {
        setGifNote(t.letters.gifSearchUnavailable);
        return;
      }
      if (!response.ok) {
        // A key Giphy will not accept is a setup problem, not a quiet network;
        // say so instead of blaming the connection.
        const problem = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setGifNote(
          problem?.error === "key_refused"
            ? t.letters.gifSearchKeyRefused
            : t.letters.gifSearchError,
        );
        return;
      }

      const payload = (await response.json()) as { results?: GifResult[] };
      const results = Array.isArray(payload.results) ? payload.results : [];
      setGifResults(results);
      if (results.length === 0) setGifNote(t.letters.gifSearchEmpty);
    } catch {
      setGifNote(t.letters.gifSearchError);
    } finally {
      setGifSearching(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || preparing || !title.trim() || !body.trim() || !date) return;
    setBusy(true);
    setError(null);
    try {
      await onSave({
        title,
        body,
        category,
        date,
        language,
        photo,
        removePhoto: removeExisting && !photo,
        decor,
      });
      clearStoredDraft();
      onClose();
    } catch (failure) {
      console.error("[letters] save failed", failure);
      setError(t.letters.saveError);
    } finally {
      setBusy(false);
    }
  };

  // A small sheet of the letter as it is being written.
  const previewSheet = (
    <div className="surface p-5">
      <p className="label flex items-center gap-2">
        <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ember/80" />
        {t.letters.categories[category]}
      </p>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-strong">
        {date ? formatDate(date, locale) : t.letters.dateLabel}
      </p>
      <h3 className="mt-3 font-display text-xl leading-tight text-ink">
        {title.trim() || t.letters.titlePlaceholder}
      </h3>

      {preview && (
        <img
          src={preview}
          alt=""
          decoding="async"
          className="mt-4 aspect-[4/3] w-full border border-line/60 object-cover"
        />
      )}

      {decor.length > 0 && <DecorCollage items={decor} compact className="mt-4" />}

      <div className="mt-4 border-t border-line/60 pt-4">
        {body.trim() ? (
          <div className="space-y-2">
            {body
              .split(/\n{2,}/)
              .slice(0, 3)
              .map((paragraph, index) => (
                <p
                  key={index}
                  className="letter-body line-clamp-4 text-[0.95rem] leading-[1.8] text-navy/85 [text-wrap:pretty]"
                >
                  {paragraph}
                </p>
              ))}
          </div>
        ) : (
          <p className="text-[12px] leading-relaxed text-muted-strong">{t.letters.previewEmpty}</p>
        )}
      </div>
    </div>
  );

  // Portalled to <body>: the page transition leaves a CSS filter on an
  // ancestor, which would otherwise pin this sheet to the document.
  return createPortal(
    <div
      ref={sheetRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={editing ? t.letters.editTitle : t.letters.addTitle}
      className="fixed inset-0 z-[88] overflow-y-auto overscroll-contain bg-scrim/60 outline-none sm:flex sm:items-start sm:justify-center sm:p-8 sm:backdrop-blur-sm"
    >
      <form
        onSubmit={submit}
        className="flex min-h-[100dvh] w-full flex-col bg-mist sm:min-h-0 sm:max-w-3xl sm:border sm:border-line sm:shadow-[0_30px_80px_-40px_rgba(34,58,79,0.5)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line/70 px-5 py-4 sm:border-0 sm:p-8 sm:pb-0">
          <p className="label pt-2">{editing ? t.letters.editTitle : t.letters.addTitle}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-line text-navy transition-colors hover:border-navy/40"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 px-5 py-5 sm:px-8 sm:py-6">
          <p className="label text-[9px] normal-case tracking-[0.08em]">
            {editing ? t.letters.editHint : t.letters.addHint}
          </p>

          {draftNotice && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-dashed border-plum/40 bg-lavender/20 px-3 py-2">
              <p className="text-[11px] leading-relaxed text-navy/80">{t.letters.draftRestored}</p>
              <button
                type="button"
                onClick={startOver}
                className="inline-flex min-h-9 items-center px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-plum underline decoration-line underline-offset-4 transition-colors hover:text-ink"
              >
                {t.letters.discardDraft}
              </button>
            </div>
          )}

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
            <div className="space-y-5">
              <div>
                <label htmlFor="letter-title" className="label block">
                  {t.letters.titleLabel}
                </label>
                <input
                  id="letter-title"
                  type="text"
                  required
                  maxLength={120}
                  autoComplete="off"
                  value={title}
                  placeholder={t.letters.titlePlaceholder}
                  onChange={(event) => setTitle(event.target.value)}
                  className={`${fieldClass} mt-2`}
                />
              </div>

              <div>
                <span className="label block">{t.letters.categoryLabel}</span>
                <div
                  className="mt-2 flex flex-wrap gap-2"
                  role="group"
                  aria-label={t.letters.categoryLabel}
                >
                  {CATEGORIES.map((option) => {
                    const active = category === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setCategory(option)}
                        aria-pressed={active}
                        className={`inline-flex min-h-11 items-center rounded-full border px-3.5 py-1.5 text-[9px] uppercase tracking-[0.16em] transition-colors ${
                          active
                            ? "border-navy bg-navy text-mist"
                            : "border-line/80 text-navy/70 hover:border-plum/40 hover:text-ink"
                        }`}
                      >
                        {t.letters.categories[option]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="letter-date" className="label block">
                  {t.letters.dateLabel}
                </label>
                <input
                  id="letter-date"
                  type="date"
                  required
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={`${fieldClass} mt-2 min-w-0 font-mono text-base sm:max-w-[220px] sm:text-[12px]`}
                />
              </div>

              <div>
                <SectionMark index="01">{t.letters.photoLabel}</SectionMark>
                <div className="mt-2 border border-line/80 bg-pale">
                  {preview ? (
                    <img
                      src={preview}
                      alt=""
                      decoding="async"
                      className="mx-auto block max-h-[min(40vh,320px)] w-auto max-w-full"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center">
                      <span className="label text-[9px]">{t.letters.choosePhoto}</span>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    void choosePhoto(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />
                <input
                  ref={cameraInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => {
                    void choosePhoto(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={preparing}
                    className={photoActionClass}
                  >
                    <Upload size={13} strokeWidth={1.5} aria-hidden="true" />
                    {preview ? t.letters.changePhoto : t.letters.choosePhoto}
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInput.current?.click()}
                    disabled={preparing}
                    className={photoActionClass}
                  >
                    <Camera size={13} strokeWidth={1.5} aria-hidden="true" />
                    {t.letters.takePhoto}
                  </button>
                  {preview && (
                    <button
                      type="button"
                      onClick={clearPhoto}
                      disabled={preparing}
                      className={`${photoActionClass} border-transparent text-muted-strong hover:text-ember`}
                    >
                      <X size={13} strokeWidth={1.5} aria-hidden="true" />
                      {t.letters.removePhoto}
                    </button>
                  )}
                </div>

                <p
                  aria-live="polite"
                  className={`label mt-2 text-[9px] normal-case tracking-[0.08em] ${
                    photoError ? "text-ember" : ""
                  }`}
                >
                  {photoError ??
                    (preparing ? t.letters.preparingPhoto : t.letters.photoHint)}
                </p>
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="letter-body" className="label block">
                    {t.letters.bodyLabel}
                  </label>
                  <span
                    className={`font-mono text-[9px] tabular-nums tracking-[0.12em] ${
                      body.length > MAX_BODY * 0.95 ? "text-ember" : "text-muted-strong"
                    }`}
                  >
                    {t.letters.characterCount(body.length, MAX_BODY)}
                  </span>
                </div>
                <textarea
                  id="letter-body"
                  required
                  rows={9}
                  maxLength={MAX_BODY}
                  value={body}
                  placeholder={t.letters.bodyPlaceholder}
                  aria-describedby="letter-body-hint"
                  onChange={(event) => setBody(event.target.value)}
                  className={`${fieldClass} mt-2 resize-y leading-relaxed`}
                />
                <p
                  id="letter-body-hint"
                  className="label mt-2 text-[9px] normal-case tracking-[0.08em]"
                >
                  {t.letters.bodyHint} · {t.letters.remaining(MAX_BODY - body.length)}
                </p>
              </div>

              <div className="border-t border-line/70 pt-5">
                <div className="flex items-baseline justify-between gap-3">
                  <SectionMark index="02">{t.letters.decorTitle}</SectionMark>
                  <span className="font-mono text-[9px] tabular-nums tracking-[0.14em] text-muted-strong">
                    {decor.length}/{MAX_DECOR}
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-muted-strong">
                  {t.letters.decorHint}
                </p>

                {decor.length > 0 && (
                  <>
                    <div className="mt-3 flex items-center gap-3 border border-dashed border-line/80 bg-pale/60 px-3 py-3">
                      <DecorCollage items={decor} compact />
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {decor.map((item, index) => (
                        <li key={`${item.kind}-${item.value}-${index}`}>
                          <button
                            type="button"
                            onClick={() =>
                              setDecor((current) => current.filter((_, i) => i !== index))
                            }
                            aria-label={`${t.letters.removeDecor}: ${decorName(item)}`}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line/80 px-2.5 text-[9px] uppercase tracking-[0.12em] text-navy/70 transition-colors hover:border-ember/50 hover:text-ember"
                          >
                            <span aria-hidden="true">{decorGlyph(item)}</span>
                            <span className="max-w-[110px] truncate normal-case tracking-[0.04em]">
                              {decorName(item)}
                            </span>
                            <X size={10} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                <p className="label mt-4 block text-[9px]">{t.letters.stampsLabel}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STAMPS.map((stamp) => {
                    const active = decor.some(
                      (item) => item.kind === "stamp" && item.value === stamp.id,
                    );
                    return (
                      <button
                        key={stamp.id}
                        type="button"
                        onClick={() => toggleDecor({ kind: "stamp", value: stamp.id })}
                        aria-pressed={active}
                        className={`rounded-[2px] border p-0.5 transition-colors ${
                          active
                            ? "border-navy/60 bg-lavender/50"
                            : "border-transparent hover:border-line"
                        }`}
                      >
                        <StampMark id={stamp.id} compact />
                      </button>
                    );
                  })}
                </div>

                <p className="label mt-4 block text-[9px]">{t.letters.stickersLabel}</p>
                <div
                  className="mt-2 flex flex-wrap gap-1.5"
                  role="group"
                  aria-label={t.letters.stickersLabel}
                >
                  {STICKERS.map((sticker) => {
                    const active = decor.some(
                      (item) => item.kind === "sticker" && item.value === sticker.id,
                    );
                    return (
                      <button
                        key={sticker.id}
                        type="button"
                        onClick={() => toggleDecor({ kind: "sticker", value: sticker.id })}
                        aria-pressed={active}
                        aria-label={sticker.name}
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-xl transition-colors ${
                          active
                            ? "border-navy/60 bg-lavender/50"
                            : "border-line/80 hover:border-plum/40"
                        }`}
                      >
                        <span aria-hidden="true">{sticker.glyph}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 border border-line/80 bg-pale/40 p-3">
                  <label htmlFor="letter-gif-query" className="label block text-[9px]">
                    {t.letters.gifSearchLabel}
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="letter-gif-query"
                      type="search"
                      value={gifQuery}
                      placeholder={t.letters.gifSearchPlaceholder}
                      aria-describedby="letter-gif-search-note"
                      onChange={(event) => {
                        setGifQuery(event.target.value);
                        setGifNote(null);
                      }}
                      onKeyDown={(event) => {
                        // Enter searches, and never submits the whole letter.
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void searchGifs();
                        }
                      }}
                      className={`${fieldClass} min-w-0 flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => void searchGifs()}
                      disabled={gifSearching || !gifQuery.trim()}
                      className={`${actionClass} shrink-0 border-line text-navy/75 hover:border-navy/40 hover:text-ink disabled:opacity-50`}
                    >
                      {gifSearching ? (
                        <Loader2
                          size={12}
                          strokeWidth={1.5}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Search size={12} strokeWidth={1.5} aria-hidden="true" />
                      )}
                      {gifSearching ? t.letters.gifSearching : t.letters.gifSearchAction}
                    </button>
                  </div>

                  <p
                    id="letter-gif-search-note"
                    aria-live="polite"
                    className="label mt-2 text-[9px] normal-case tracking-[0.08em]"
                  >
                    {gifNote ?? t.letters.gifSearchHint}
                  </p>

                  {gifResults.length > 0 && (
                    <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {gifResults.map((gif) => (
                        <li key={gif.id}>
                          <button
                            type="button"
                            onClick={() => addGifUrl(gif.url)}
                            aria-label={gif.title || t.letters.gifAdd}
                            className="block w-full overflow-hidden border border-line/70 bg-mist transition-colors hover:border-navy/40"
                          >
                            <img
                              src={gif.preview}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="h-16 w-full object-cover"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="mt-2 text-[9px] text-muted-strong">
                    <a
                      href="https://giphy.com"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline decoration-line underline-offset-2 transition-colors hover:text-ink"
                    >
                      {t.letters.gifPoweredBy}
                    </a>
                  </p>
                </div>

                <label htmlFor="letter-gif" className="label mt-4 block text-[9px]">
                  {t.letters.gifLabel}
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="letter-gif"
                    type="url"
                    value={gifUrl}
                    placeholder={t.letters.gifPlaceholder}
                    aria-describedby="letter-gif-hint"
                    onChange={(event) => {
                      setGifUrl(event.target.value);
                      setGifError(null);
                    }}
                    onKeyDown={(event) => {
                      // Enter belongs to the piece, not to the whole letter.
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addGif();
                      }
                    }}
                    className={`${fieldClass} min-w-0 flex-1`}
                  />
                  <button
                    type="button"
                    onClick={addGif}
                    disabled={!gifUrl.trim()}
                    className={`${actionClass} shrink-0 border-line text-navy/75 hover:border-navy/40 hover:text-ink disabled:opacity-50`}
                  >
                    <Plus size={12} strokeWidth={1.5} aria-hidden="true" />
                    {t.letters.gifAdd}
                  </button>
                </div>
                <p
                  id="letter-gif-hint"
                  aria-live="polite"
                  className={`label mt-2 text-[9px] normal-case tracking-[0.08em] ${
                    gifError ? "text-ember" : ""
                  }`}
                >
                  {gifError ?? t.letters.gifHint}
                </p>
              </div>

              {/* The preview, where the sheet is one column. */}
              <div className="lg:hidden">
                <p className="label mb-2 block text-[9px]">{t.letters.previewLabel}</p>
                {previewSheet}
              </div>
            </div>

            <aside aria-label={t.letters.previewLabel} className="hidden lg:block">
              <div className="sticky top-4">
                <p className="label mb-2 block text-[9px]">{t.letters.previewLabel}</p>
                {previewSheet}
              </div>
            </aside>
          </div>
        </div>

        {error && (
          <p role="alert" className="px-5 pb-2 text-[11px] leading-relaxed text-ember sm:px-8">
            {error}
          </p>
        )}

        <footer className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line/70 bg-mist/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-8 sm:py-6 sm:pb-8">
          <button
            type="submit"
            disabled={busy || preparing || !title.trim() || !body.trim() || !date}
            className={`${actionClass} flex-1 border-navy/70 font-mono text-navy hover:bg-navy hover:text-mist disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none`}
          >
            {(busy || preparing) && (
              <Loader2 size={12} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
            )}
            {preparing
              ? t.letters.preparingPhoto
              : busy
                ? editing
                  ? t.letters.savingChanges
                  : t.letters.saving
                : editing
                  ? t.letters.saveChanges
                  : t.letters.save}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`${actionClass} border-line text-navy/70 hover:border-navy/40 hover:text-ink`}
          >
            {t.letters.cancel}
          </button>
          <p className="label ml-auto hidden text-[9px] normal-case tracking-[0.08em] sm:block">
            {t.letters.languageHint}
          </p>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

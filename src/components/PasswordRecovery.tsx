import { AlertCircle, ArrowLeft, ArrowRight, Lock, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  MIN_PASSWORD_LENGTH,
  type NewPasswordResult,
  type ResetRequestResult,
} from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";

const headingClass =
  "mt-5 font-display text-3xl font-extralight leading-tight text-ink sm:text-4xl";
const bodyClass = "mt-4 text-[13px] leading-relaxed text-muted-strong";
const fieldClass =
  "mt-2 w-full border-0 border-b border-line bg-transparent py-3 text-base text-ink outline-none transition-colors placeholder:text-muted-strong/60 focus:border-navy";
const submitClass =
  "mt-8 inline-flex w-full items-center justify-center gap-3 border border-navy/70 px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.28em] text-navy transition-colors hover:bg-navy hover:text-mist disabled:cursor-not-allowed disabled:opacity-50";
const messageClass = "mt-3 text-[11px] text-ember";

interface ForgotProps {
  /** True when the link she followed had already expired. */
  expiredLink: boolean;
  onSubmit: (address: string) => Promise<ResetRequestResult>;
  onBack: () => void;
}

/** Asks for the email; the answer is the same whether or not she has an account. */
export function ForgotPasswordForm({ expiredLink, onSubmit, onBack }: ForgotProps) {
  const { t } = useLanguage();
  const [address, setAddress] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setSending(true);
    const result = await onSubmit(address);
    setSending(false);

    if (result.status === "ok") {
      setSent(true);
      return;
    }
    if (result.status === "invalid") {
      setMessage(t.auth.invalid);
      return;
    }
    setMessage(
      result.detail ? `${t.auth.resetError} ${result.detail}` : t.auth.resetError,
    );
  };

  if (sent) {
    return (
      <>
        <Mail size={22} strokeWidth={1.4} className="text-ember" aria-hidden="true" />
        <h1 className={headingClass}>{t.auth.resetTitle}</h1>
        <p role="status" className={bodyClass}>
          {t.auth.resetSent}
        </p>
        <button type="button" onClick={onBack} className="btn-quiet mt-8">
          <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
          {t.auth.resetBack}
        </button>
      </>
    );
  }

  return (
    <>
      <Mail size={22} strokeWidth={1.4} className="text-ember" aria-hidden="true" />
      <h1 className={headingClass}>{t.auth.resetTitle}</h1>
      <p className={bodyClass}>{t.auth.resetSubtitle}</p>

      {expiredLink && !message && (
        <p
          role="alert"
          className="mt-4 border-l border-ember/50 pl-3 text-[11px] leading-relaxed text-ember"
        >
          {t.auth.linkExpired}
        </p>
      )}

      <form onSubmit={submit} className="mt-9" noValidate>
        <label htmlFor="reset-email" className="label block">
          {t.auth.emailLabel}
        </label>
        <input
          id="reset-email"
          type="email"
          required
          autoComplete="email"
          value={address}
          placeholder={t.auth.emailPlaceholder}
          onChange={(event) => setAddress(event.target.value)}
          aria-describedby={message ? "reset-message" : undefined}
          className={fieldClass}
        />

        {message && (
          <p id="reset-message" role="alert" className={messageClass}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={sending || !address.trim()}
          className={submitClass}
        >
          {sending ? t.auth.resetSending : t.auth.resetSend}
          <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </form>

      <button type="button" onClick={onBack} className="btn-quiet mt-6">
        <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
        {t.auth.resetBack}
      </button>
    </>
  );
}

interface NewPasswordProps {
  onSubmit: (password: string) => Promise<NewPasswordResult>;
  /** Back to the gate; the recovery session is signed out. */
  onCancel: () => void;
  /** Used when the link itself was no longer good. */
  onRequestNewLink: () => void;
}

/** The screen a recovery link opens: choose the password that replaces the old one. */
export function NewPasswordForm({
  onSubmit,
  onCancel,
  onRequestNewLink,
}: NewPasswordProps) {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setMessage(t.auth.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setMessage(t.auth.passwordMismatch);
      return;
    }

    setSaving(true);
    const result = await onSubmit(password);
    // Success removes this screen as the room opens behind it.
    if (result.status === "ok") return;

    setSaving(false);
    if (result.status === "tooShort") {
      setMessage(t.auth.passwordTooShort);
      return;
    }
    if (result.status === "linkExpired") {
      setExpired(true);
      return;
    }
    setMessage(
      result.detail
        ? `${t.auth.newPasswordError} ${result.detail}`
        : t.auth.newPasswordError,
    );
  };

  if (expired) {
    return (
      <>
        <AlertCircle
          size={22}
          strokeWidth={1.4}
          className="text-ember"
          aria-hidden="true"
        />
        <h1 className={headingClass}>{t.auth.linkExpiredTitle}</h1>
        <p className={bodyClass}>{t.auth.linkExpired}</p>
        <button type="button" onClick={onRequestNewLink} className={submitClass}>
          {t.auth.requestNewLink}
          <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <button type="button" onClick={onCancel} className="btn-quiet mt-6">
          <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
          {t.auth.resetBack}
        </button>
      </>
    );
  }

  return (
    <>
      <Lock size={22} strokeWidth={1.4} className="text-ember" aria-hidden="true" />
      <h1 className={headingClass}>{t.auth.newPasswordTitle}</h1>
      <p className={bodyClass}>{t.auth.newPasswordSubtitle}</p>

      <form onSubmit={submit} className="mt-9" noValidate>
        <label htmlFor="new-password" className="label block">
          {t.auth.newPasswordLabel}
        </label>
        <input
          id="new-password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          placeholder={t.auth.passwordHint}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby={message ? "new-password-message" : undefined}
          className={fieldClass}
        />

        <label htmlFor="confirm-password" className="label mt-7 block">
          {t.auth.confirmPasswordLabel}
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          placeholder={t.auth.passwordPlaceholder}
          onChange={(event) => setConfirm(event.target.value)}
          aria-describedby={message ? "new-password-message" : undefined}
          className={fieldClass}
        />

        {message && (
          <p id="new-password-message" role="alert" className={messageClass}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !password || !confirm}
          className={submitClass}
        >
          {saving ? t.auth.savingPassword : t.auth.savePassword}
          <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </form>

      <button type="button" onClick={onCancel} className="btn-quiet mt-6">
        <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
        {t.auth.resetBack}
      </button>
    </>
  );
}

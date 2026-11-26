import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  LogOut,
  Mail,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { art } from "../data/art";
import { site } from "../data/site";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { LanguageSelector } from "./LanguageSelector";
import { Plate } from "./Plate";
import { ForgotPasswordForm, NewPasswordForm } from "./PasswordRecovery";
import { BlossomHalo, PetalField, VineLines } from "./Marks";

function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <PetalField />
      <BlossomHalo className="moon pointer-events-none absolute -right-[34vw] -top-[20vw] w-[86vw] max-w-[520px] text-periwinkle/70 sm:-right-[8%] sm:-top-[12%] sm:w-[36vw]" />
      <VineLines className="pointer-events-none absolute -left-[8%] bottom-[4%] hidden h-[48vh] w-[18vw] text-periwinkle/50 sm:block" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 border border-line/60 sm:inset-5"
      />

      <header className="relative z-10 flex items-center justify-between gap-4 px-7 py-6 sm:px-11">
        <div>
          <p className="font-display text-[12px] uppercase tracking-[0.24em] text-ink">
            {site.title}
          </p>
          <p className="jp mt-1 text-[9px] tracking-[0.3em] text-muted-strong">
            {site.jpTitle}
          </p>
        </div>
        <LanguageSelector />
      </header>

      {/* A print left at the threshold, waiting for whoever comes in. */}
      <div className="pointer-events-none absolute bottom-[13%] right-[7%] hidden w-[10.5rem] xl:block">
        <Plate src={art.shore} caption="the sea between us." tilt="3deg" tape />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-line/60 px-7 py-4 sm:px-11">
        <p className="caption flex items-center gap-2 text-[15px] text-muted-strong">
          <span aria-hidden="true" className="signal-dot h-1.5 w-1.5 rounded-full bg-ember" />
          {t.landing.eyebrow}
        </p>
      </footer>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const {
    status,
    email,
    errorDetail,
    signIn,
    signOut,
    retry,
    recovery,
    requestPasswordReset,
    setNewPassword,
  } = useAuth();
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // An expired link lands straight on the form that sends a fresh one.
  const [view, setView] = useState<"signIn" | "forgot">(
    recovery.linkFailed ? "forgot" : "signIn",
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setSending(true);
    const result = await signIn(address, password);
    // On success the auth listener moves the gate to its loading state, so the
    // button stays disabled until this screen is replaced.
    if (result.status === "ok") return;

    setSending(false);
    if (result.status === "invalid") {
      setMessage(t.auth.invalid);
      return;
    }
    if (result.status === "missingPassword") {
      setMessage(t.auth.missingPassword);
      return;
    }
    if (result.status === "badCredentials") {
      setMessage(t.auth.badCredentials);
      setPassword("");
      return;
    }
    setMessage(result.detail ? `${t.auth.error} ${result.detail}` : t.auth.error);
  };

  if (status === "unconfigured") {
    return (
      <AuthShell>
        <p className="label text-ember">{t.auth.eyebrow}</p>
        <h1 className="mt-6 font-display text-3xl font-extralight leading-tight text-ink sm:text-4xl">
          {t.auth.unconfiguredTitle}
        </h1>
        <p className="mt-4 text-[13px] leading-relaxed text-muted-strong">
          {t.auth.unconfiguredBody}
        </p>
        <p className="mt-3 text-[12px] leading-relaxed text-muted-strong">
          {t.auth.unconfiguredHint}
        </p>
      </AuthShell>
    );
  }

  if (recovery.active) {
    return (
      <AuthShell>
        <NewPasswordForm
          onSubmit={setNewPassword}
          onCancel={() => void signOut()}
          onRequestNewLink={() => {
            void signOut();
            setView("forgot");
          }}
        />
      </AuthShell>
    );
  }

  if (status === "loading") {
    return (
      <AuthShell>
        <div className="flex items-center gap-3 text-navy/80">
          <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
          <p className="label text-[10px]">{t.auth.loading}</p>
        </div>
      </AuthShell>
    );
  }

  if (status === "error") {
    return (
      <AuthShell>
        <AlertCircle size={22} strokeWidth={1.4} className="text-ember" aria-hidden="true" />
        <h1 className="mt-5 font-display text-3xl font-extralight leading-tight text-ink">
          {t.auth.verifyErrorTitle}
        </h1>
        <p className="mt-4 text-[13px] leading-relaxed text-muted-strong">
          {t.auth.verifyErrorBody}
        </p>
        {errorDetail && (
          <p className="mt-4 break-words border-l border-ember/50 pl-3 font-mono text-[10px] leading-relaxed text-ember">
            {errorDetail}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={() => void retry()}
            className="inline-flex items-center gap-2 border border-navy/70 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-navy transition-colors hover:bg-navy hover:text-mist"
          >
            {t.auth.retry}
          </button>
          <button type="button" onClick={() => void signOut()} className="btn-quiet">
            <LogOut size={13} strokeWidth={1.5} />
            {t.auth.signOut}
          </button>
        </div>
      </AuthShell>
    );
  }

  if (status === "pending") {
    return (
      <AuthShell>
        <Lock size={22} strokeWidth={1.4} className="text-ember" aria-hidden="true" />
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-strong">
          {t.auth.signedInAs} {email}
        </p>
        <h1 className="mt-4 font-display text-3xl font-extralight leading-tight text-ink">
          {t.auth.pendingTitle}
        </h1>
        <p className="mt-4 text-[13px] leading-relaxed text-muted-strong">
          {t.auth.pendingBody(email)}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <button
            type="button"
            onClick={() => void retry()}
            className="inline-flex items-center gap-2 border border-navy/70 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-navy transition-colors hover:bg-navy hover:text-mist"
          >
            {t.auth.checkAgain}
          </button>
          <button type="button" onClick={() => void signOut()} className="btn-quiet">
            <LogOut size={13} strokeWidth={1.5} />
            {t.auth.signOut}
          </button>
        </div>
      </AuthShell>
    );
  }

  if (status === "signedOut" && view === "forgot") {
    return (
      <AuthShell>
        <ForgotPasswordForm
          expiredLink={recovery.linkFailed}
          onSubmit={requestPasswordReset}
          onBack={() => setView("signIn")}
        />
      </AuthShell>
    );
  }

  if (status === "signedOut") {
    return (
      <AuthShell>
        <Mail size={22} strokeWidth={1.4} className="text-ember" aria-hidden="true" />
        <h1 className="mt-5 font-display text-3xl font-extralight leading-tight text-ink sm:text-4xl">
          {t.auth.title}
        </h1>
        <p className="mt-4 text-[13px] leading-relaxed text-muted-strong">
          {t.auth.subtitle}
        </p>

        <form onSubmit={submit} className="mt-9" noValidate>
          <label htmlFor="auth-email" className="label block">
            {t.auth.emailLabel}
          </label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={address}
            placeholder={t.auth.emailPlaceholder}
            onChange={(event) => setAddress(event.target.value)}
            aria-describedby={message ? "auth-message" : undefined}
            className="mt-2 w-full border-0 border-b border-line bg-transparent py-3 text-base text-ink outline-none transition-colors placeholder:text-muted-strong/60 focus:border-navy"
          />

          <label htmlFor="auth-password" className="label mt-7 block">
            {t.auth.passwordLabel}
          </label>
          <input
            id="auth-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            placeholder={t.auth.passwordPlaceholder}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={message ? "auth-message" : undefined}
            className="mt-2 w-full border-0 border-b border-line bg-transparent py-3 text-base text-ink outline-none transition-colors placeholder:text-muted-strong/60 focus:border-navy"
          />

          {message && (
            <p id="auth-message" role="alert" className="mt-3 text-[11px] text-ember">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={sending || !address.trim() || !password}
            className="mt-8 inline-flex w-full items-center justify-center gap-3 border border-navy/70 px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.28em] text-navy transition-colors hover:bg-navy hover:text-mist disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? t.auth.signingIn : t.auth.signIn}
            <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </form>

        <button
          type="button"
          onClick={() => setView("forgot")}
          className="mt-7 block w-full text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-strong underline-offset-4 transition-colors hover:text-navy hover:underline"
        >
          {t.auth.forgotPassword}
        </button>
      </AuthShell>
    );
  }

  return <>{children}</>;
}

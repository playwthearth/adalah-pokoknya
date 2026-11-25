import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { storageKeys } from "../data/site";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { MemberRole } from "../types";

export type AuthStatus =
  | "loading"
  | "signedOut"
  | "pending"
  | "ready"
  | "error"
  | "unconfigured";

interface AuthContextValue {
  status: AuthStatus;
  role: MemberRole | null;
  email: string;
  userId: string;
  /** Why the membership check failed, shown so setup problems are visible. */
  errorDetail: string;
  signIn: (address: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  /** Re-check membership (used after the owner adds an email). */
  retry: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Leave the site untouched for this long and the visit ends. */
const IDLE_LIMIT_MS = 30 * 60 * 1000;
/** How often an idle visit is checked; a closed tab is caught on the next load. */
const IDLE_CHECK_MS = 20 * 1000;
/** Activity is written to storage at most this often, to keep scrolling quiet. */
const ACTIVITY_SAVE_MS = 15 * 1000;
/** Everything that counts as the reader still being here. */
const ACTIVITY_EVENTS = [
  "pointerdown",
  "pointermove",
  "keydown",
  "wheel",
  "scroll",
  "touchstart",
] as const;

/** `detail` carries the provider's own wording so setup problems are visible. */
export interface SignInResult {
  status: "ok" | "invalid" | "missingPassword" | "badCredentials" | "error";
  detail?: string;
}

/** Flattens a Supabase error into one readable line. */
function describeError(err: unknown): string {
  const { code, message, hint } = (err ?? {}) as {
    code?: string;
    message?: string;
    hint?: string;
  };
  return [code, message, hint].filter(Boolean).join(" · ") || String(err);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<MemberRole | null>(null);
  const [errorDetail, setErrorDetail] = useState("");
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );

  // Latest request wins: a slow membership check must never overwrite the
  // state of a newer sign-in or sign-out.
  const resolveSeq = useRef(0);
  // Whose membership is already settled, so the sign-in path and the auth
  // listener cannot both run the same check.
  const resolvedUser = useRef<string | null>(null);

  const resolve = useCallback(async (next: Session | null, force = false) => {
    if (!supabase) return;
    if (!force && next?.user.id === resolvedUser.current) return;
    const seq = ++resolveSeq.current;
    setSession(next);

    if (!next) {
      resolvedUser.current = null;
      setRole(null);
      setErrorDetail("");
      setStatus("signedOut");
      // The next sign-in starts its own thirty minutes.
      try {
        window.localStorage.removeItem(storageKeys.lastActive);
      } catch {
        // Storage may be blocked; there is nothing to clear then.
      }
      return;
    }

    setStatus("loading");
    try {
      // Claims the owner seat when the allowlist is still empty, otherwise
      // returns "owner" / "member" / null for anyone not on the list.
      const { data, error } = await supabase.rpc("claim_membership");
      if (seq !== resolveSeq.current) return;
      if (error) throw error;
      const nextRole = data === "owner" || data === "member" ? data : null;
      resolvedUser.current = next.user.id;
      setRole(nextRole);
      setErrorDetail("");
      setStatus(nextRole ? "ready" : "pending");
    } catch (err) {
      if (seq !== resolveSeq.current) return;
      console.error("[auth] claim_membership failed", err);
      setRole(null);
      setErrorDetail(describeError(err));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (alive) void resolve(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      // Defer: awaiting Supabase inside this callback can deadlock the client.
      window.setTimeout(() => {
        if (alive) void resolve(next);
      }, 0);
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [resolve]);

  const signIn = useCallback(
    async (address: string, password: string): Promise<SignInResult> => {
      if (!supabase) return { status: "error" };
      const email = address.trim().toLowerCase();
      if (!isValidEmail(email)) return { status: "invalid" };
      if (!password) return { status: "missingPassword" };

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        // Resolve from the session we just got instead of waiting only on the
        // auth listener: if that event never fires the gate would sit on a
        // disabled form forever. The listener's later call is a no-op.
        await resolve(data.session ?? null);
        return { status: "ok" };
      }

      if (error.code === "invalid_credentials") return { status: "badCredentials" };

      console.error("[auth] signInWithPassword failed", error);
      return { status: "error", detail: describeError(error) };
    },
    [resolve],
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    // Cancel any membership check still in flight, so it cannot land after this.
    resolveSeq.current += 1;
    resolvedUser.current = null;
    try {
      window.localStorage.removeItem(storageKeys.lastActive);
    } catch {
      // Storage may be blocked; the session still ends below.
    }
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
    setErrorDetail("");
    setStatus("signedOut");
  }, []);

  // Walking away for half an hour ends the visit, so the gate asks for the
  // password again. The last activity is kept in storage, because closing the
  // tab or reloading should not hand out a fresh thirty minutes.
  const userId = session?.user.id ?? "";
  useEffect(() => {
    if (!supabase) return;
    // Signed out, or the session has not landed yet: the stamp belongs to the
    // visit that wrote it, so leave it alone for the sign-out path to clear.
    if (!userId) return;

    let last = Date.now();
    try {
      const saved = Number(window.localStorage.getItem(storageKeys.lastActive));
      // A clock that was set back could leave a future stamp behind.
      if (Number.isFinite(saved) && saved > 0 && saved <= Date.now()) last = saved;
    } catch {
      // Fall back to "just now", which simply grants a full window.
    }

    /** Signs out once the window has passed; false means this visit is over. */
    const expireIfIdle = () => {
      if (Date.now() - last < IDLE_LIMIT_MS) return true;
      void signOut();
      return false;
    };

    if (!expireIfIdle()) return;

    const saveStamp = () => {
      try {
        window.localStorage.setItem(storageKeys.lastActive, String(last));
      } catch {
        // Playback and reading carry on; the timer still runs in memory.
      }
    };

    // A visit with nothing stored still gets a stamp, so leaving the tab alone
    // and reloading later is measured from here rather than from the reload.
    saveStamp();

    let savedAt = last;
    const markActive = () => {
      last = Date.now();
      if (last - savedAt < ACTIVITY_SAVE_MS) return;
      savedAt = last;
      saveStamp();
    };

    // Coming back after a long absence ends the visit before a stray pointer
    // move counts as activity, so check first and only then mark the return.
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (expireIfIdle()) markActive();
    };

    ACTIVITY_EVENTS.forEach((name) =>
      window.addEventListener(name, markActive, { passive: true }),
    );
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(expireIfIdle, IDLE_CHECK_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, markActive));
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
      // Nothing is written back here: a sign-out clears the stamp, and writing
      // it again from this cleanup would hand the next visit a fresh window.
    };
  }, [signOut, userId]);

  const retry = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    // Forced: this is the explicit "check again" path, so re-run the check even
    // for a user whose membership was already settled.
    await resolve(data.session, true);
  }, [resolve]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      role,
      email: session?.user.email ?? "",
      userId: session?.user.id ?? "",
      errorDetail,
      signIn,
      signOut,
      retry,
    }),
    [status, role, session, errorDetail, signIn, signOut, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

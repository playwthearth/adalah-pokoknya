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
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
    setErrorDetail("");
    setStatus("signedOut");
  }, []);

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

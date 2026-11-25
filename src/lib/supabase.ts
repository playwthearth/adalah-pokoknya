import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

export type RecoveryLink =
  | { kind: "none" }
  | { kind: "recovery" }
  | { kind: "failed"; detail: string };

/**
 * A recovery email lands with its proof in the URL — in the same fragment the
 * hash router reads. Read it before the client starts, because the client
 * clears the address bar once it has picked the tokens up, and the intent
 * would be lost with them.
 */
function readRecoveryLink(): RecoveryLink {
  if (typeof window === "undefined") return { kind: "none" };

  const hash = new URLSearchParams(window.location.hash.replace(/^#\/?/, ""));
  const query = new URLSearchParams(window.location.search);
  const pick = (key: string) => hash.get(key) ?? query.get(key);

  const failure = pick("error_code") ?? pick("error");
  if (failure) {
    const detail = [failure, pick("error_description")].filter(Boolean).join(" · ");
    console.warn("[auth] recovery link rejected:", detail);
    return { kind: "failed", detail };
  }

  // Implicit links say `type=recovery`; PKCE and token-hash links carry the
  // proof in `code` / `token_hash` instead.
  if (pick("type") === "recovery" || pick("token_hash") || pick("code")) {
    return { kind: "recovery" };
  }

  return { kind: "none" };
}

/** What the address bar said on the way in; only set on a recovery landing. */
export const recoveryLink: RecoveryLink = readRecoveryLink();

/**
 * The anon key is designed to be public: every table is protected by row level
 * security, so the browser can only ever read what the signed-in member may see.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

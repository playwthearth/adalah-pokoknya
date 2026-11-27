/**
 * GIF search for the letter decorator.
 *
 * Vercel deploys this file as a function at /api/gif-search. The Giphy key is
 * read from the project environment (`GIPHY_API_KEY`) and never sent to the
 * browser; the request must carry a signed-in Supabase session, which is
 * checked against the project's own auth endpoint.
 */

interface GifResult {
  id: string;
  title: string;
  preview: string;
  url: string;
}

interface GiphyImage {
  url?: string;
}

interface GiphyGif {
  id?: string;
  title?: string;
  images?: Record<string, GiphyImage | undefined>;
}

const LIMIT = 12;

function reply(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
      ...headers,
    },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return reply({ error: "method_not_allowed" }, 405, { allow: "GET" });
  }

  const key = process.env.GIPHY_API_KEY?.trim();
  if (!key) return reply({ error: "not_configured" }, 503);

  const token = (request.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) return reply({ error: "unauthorized" }, 401);

  const supabaseUrl = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
  if (!supabaseUrl || !anonKey) return reply({ error: "not_configured" }, 503);

  // Who is asking? A valid session for this project is the whole gate: the
  // project only ever has the two accounts that were created by hand.
  const who = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, authorization: `Bearer ${token}` },
  });
  if (!who.ok) return reply({ error: "unauthorized" }, 401);
  const user = (await who.json()) as { id?: string };
  if (!user?.id) return reply({ error: "unauthorized" }, 401);

  const query = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (!query) return reply({ results: [] });

  const upstream = new URL("https://api.giphy.com/v1/gifs/search");
  upstream.searchParams.set("api_key", key);
  upstream.searchParams.set("q", query);
  upstream.searchParams.set("limit", String(LIMIT));
  upstream.searchParams.set("rating", "pg-13");
  upstream.searchParams.set("lang", "en");

  let payload: { data?: GiphyGif[] };
  try {
    const found = await fetch(upstream, { headers: { accept: "application/json" } });
    if (!found.ok) return reply({ error: "upstream" }, 502);
    payload = (await found.json()) as { data?: GiphyGif[] };
  } catch {
    return reply({ error: "upstream" }, 502);
  }

  const results: GifResult[] = [];
  for (const gif of payload.data ?? []) {
    const preview = gif.images?.fixed_width_small?.url ?? gif.images?.fixed_width?.url;
    const url = gif.images?.original?.url ?? gif.images?.fixed_width?.url;
    if (!gif.id || !preview || !url) continue;
    results.push({ id: gif.id, title: gif.title ?? "", preview, url });
  }

  return reply({ results }, 200, { "cache-control": "private, max-age=300" });
}

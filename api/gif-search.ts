/**
 * GIF search for the letter decorator.
 *
 * Vercel deploys this file as a function at /api/gif-search. The Giphy key is
 * read from the project environment (`GIPHY_API_KEY`) and never sent to the
 * browser; the request must carry a signed-in Supabase session, which is
 * checked against the project's own auth endpoint.
 *
 * The handler answers both shapes a host may use: the Node function signature
 * (a request and a response object to write to) and the Web signature (return
 * a Response). Vercel's Node runtime uses the first.
 */

interface NodeRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface NodeResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

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

interface Answer {
  status: number;
  body: string;
  headers: Record<string, string>;
}

const LIMIT = 12;

function answer(body: unknown, status = 200, headers: Record<string, string> = {}): Answer {
  return {
    status,
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
      ...headers,
    },
  };
}

function header(request: { headers: Record<string, string | string[] | undefined> }, name: string) {
  const value = request.headers[name] ?? request.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function respond(
  method: string,
  authorization: string,
  query: string,
): Promise<Answer> {
  if (method !== "GET") return answer({ error: "method_not_allowed" }, 405, { allow: "GET" });

  const key = process.env.GIPHY_API_KEY?.trim();
  if (!key) return answer({ error: "not_configured" }, 503);

  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return answer({ error: "unauthorized" }, 401);

  const supabaseUrl = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
  if (!supabaseUrl || !anonKey) return answer({ error: "not_configured" }, 503);

  // Who is asking? A valid session for this project is the whole gate: the
  // project only ever has the two accounts that were created by hand.
  const who = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, authorization: `Bearer ${token}` },
  });
  if (!who.ok) return answer({ error: "unauthorized" }, 401);
  const user = (await who.json()) as { id?: string };
  if (!user?.id) return answer({ error: "unauthorized" }, 401);

  const term = query.trim().slice(0, 60);
  if (!term) return answer({ results: [] });

  const upstream = new URL("https://api.giphy.com/v1/gifs/search");
  upstream.searchParams.set("api_key", key);
  upstream.searchParams.set("q", term);
  upstream.searchParams.set("limit", String(LIMIT));
  upstream.searchParams.set("rating", "pg-13");
  upstream.searchParams.set("lang", "en");

  let payload: { data?: GiphyGif[] };
  try {
    const found = await fetch(upstream, { headers: { accept: "application/json" } });
    if (!found.ok) return answer({ error: "upstream" }, 502);
    payload = (await found.json()) as { data?: GiphyGif[] };
  } catch {
    return answer({ error: "upstream" }, 502);
  }

  const results: GifResult[] = [];
  for (const gif of payload.data ?? []) {
    const preview = gif.images?.fixed_width_small?.url ?? gif.images?.fixed_width?.url;
    const url = gif.images?.original?.url ?? gif.images?.fixed_width?.url;
    if (!gif.id || !preview || !url) continue;
    results.push({ id: gif.id, title: gif.title ?? "", preview, url });
  }

  return answer({ results }, 200, { "cache-control": "private, max-age=300" });
}

export default async function handler(
  request: NodeRequest | Request,
  output?: NodeResponse,
): Promise<Response | void> {
  let result: Answer;
  try {
    if (typeof Request !== "undefined" && request instanceof Request) {
      const url = new URL(request.url);
      result = await respond(
        request.method,
        request.headers.get("authorization") ?? "",
        url.searchParams.get("q") ?? "",
      );
    } else {
      const nodeRequest = request as NodeRequest;
      // The Node URL here is a path with a query string, not a full address.
      const url = new URL(nodeRequest.url ?? "/", "https://local.invalid");
      result = await respond(
        nodeRequest.method ?? "GET",
        header(nodeRequest, "authorization"),
        url.searchParams.get("q") ?? "",
      );
    }
  } catch (failure) {
    console.error("[gif-search] unexpected failure", failure);
    result = answer({ error: "server" }, 500);
  }

  if (output) {
    output.statusCode = result.status;
    for (const [name, value] of Object.entries(result.headers)) {
      output.setHeader(name, value);
    }
    output.end(result.body);
    return;
  }

  return new Response(result.body, { status: result.status, headers: result.headers });
}

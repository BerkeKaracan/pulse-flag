import {
  getFeatureFlagsAdminApiKey,
  getFeatureFlagsApiUrl,
} from "@/lib/server-env";
import { resolveAccessToken } from "@/lib/supabase/access-token";
import { createClient } from "@/lib/supabase/server";

export class AdminUpstreamError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function isSafePathSegment(segment: string): boolean {
  if (!segment || segment === "." || segment === "..") return false;
  if (segment.includes("/") || segment.includes("\\") || segment.includes("\0")) {
    return false;
  }
  return true;
}

function friendlyUpstreamDetail(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail;
    }
  } catch {
    // keep raw body
  }
  if (status === 401) return "Unauthorized. Sign in again.";
  if (status === 502 || !body) {
    return "Upstream API unreachable. Check FEATURE_FLAGS_API_URL and that FastAPI is running.";
  }
  return body;
}

/**
 * Call FastAPI /admin/* with service key + verified Supabase access token.
 * Used by the BFF route and by Server Components (skips self-fetch hop).
 */
export async function adminUpstream(
  pathSegments: string[],
  init?: {
    method?: string;
    search?: string;
    body?: ArrayBuffer | string | undefined;
    contentType?: string | null;
  },
): Promise<Response> {
  if (!pathSegments.length || !pathSegments.every(isSafePathSegment)) {
    throw new AdminUpstreamError(400, "Invalid path");
  }

  const supabase = await createClient();
  const accessToken = await resolveAccessToken(supabase);
  if (!accessToken) {
    throw new AdminUpstreamError(
      401,
      "Unauthorized — no valid Supabase session. Sign out and sign in again.",
    );
  }

  const adminKey = getFeatureFlagsAdminApiKey();
  if (!adminKey) {
    throw new AdminUpstreamError(
      503,
      "FEATURE_FLAGS_ADMIN_API_KEY is not configured",
    );
  }

  const apiUrl = getFeatureFlagsApiUrl();
  const search = init?.search ?? "";
  const target = `${apiUrl}/admin/${pathSegments.join("/")}${search}`;

  const headers = new Headers();
  if (init?.contentType) headers.set("content-type", init.contentType);
  headers.set("authorization", `Bearer ${adminKey}`);
  headers.set("X-Supabase-Access-Token", accessToken);

  const method = init?.method ?? "GET";
  let body: ArrayBuffer | string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = init?.body;
  }

  try {
    return await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    throw new AdminUpstreamError(502, "Upstream API unreachable");
  }
}

export async function adminUpstreamJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const clean = path.startsWith("/") ? path.slice(1) : path;
  const [pathname, search = ""] = clean.split("?");
  const segments = pathname.split("/").filter(Boolean);

  const method = init?.method ?? "GET";
  const contentType =
    init?.headers instanceof Headers
      ? init.headers.get("content-type")
      : typeof init?.headers === "object" && init.headers
        ? (init.headers as Record<string, string>)["Content-Type"] ??
          (init.headers as Record<string, string>)["content-type"]
        : init?.body
          ? "application/json"
          : null;

  let body: ArrayBuffer | string | undefined;
  if (typeof init?.body === "string") {
    body = init.body;
  } else if (init?.body) {
    body = await new Response(init.body).arrayBuffer();
  }

  const upstream = await adminUpstream(segments, {
    method,
    search: search ? `?${search}` : "",
    body,
    contentType: contentType ?? (init?.body ? "application/json" : null),
  });

  if (upstream.status === 204) {
    return undefined as T;
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    throw new AdminUpstreamError(
      upstream.status,
      friendlyUpstreamDetail(upstream.status, text),
    );
  }

  return (await upstream.json()) as T;
}

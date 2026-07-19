import { NextRequest, NextResponse } from "next/server";
import {
  getFeatureFlagsAdminApiKey,
  getFeatureFlagsApiUrl,
} from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function isSafePathSegment(segment: string): boolean {
  if (!segment || segment === "." || segment === "..") return false;
  if (segment.includes("/") || segment.includes("\\") || segment.includes("\0")) {
    return false;
  }
  return true;
}

async function proxy(request: NextRequest, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user || !session?.access_token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const adminKey = getFeatureFlagsAdminApiKey();
  if (!adminKey) {
    return NextResponse.json(
      { detail: "FEATURE_FLAGS_ADMIN_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const { path } = await context.params;
  if (!path?.length || !path.every(isSafePathSegment)) {
    return NextResponse.json({ detail: "Invalid path" }, { status: 400 });
  }

  const apiUrl = getFeatureFlagsApiUrl();
  const target = `${apiUrl}/admin/${path.join("/")}${request.nextUrl.search}`;

  // Service key + verified-on-API user JWT. Never send spoofable X-User-Id.
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("authorization", `Bearer ${adminKey}`);
  headers.set("X-Supabase-Access-Token", session.access_token);

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) responseHeaders.set("content-type", upstreamType);

    if (upstream.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: responseHeaders,
      });
    }

    const payload = await upstream.arrayBuffer();
    return new NextResponse(payload, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { detail: "Upstream API unreachable" },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;

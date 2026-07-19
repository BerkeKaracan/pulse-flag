import { NextRequest, NextResponse } from "next/server";
import { getFeatureFlagsApiUrl } from "@/lib/server-env";

/**
 * Proxies delivery evaluate calls for the admin "Canlı test" panel.
 * Optional Authorization is the project's delivery api_key (same as SaaS Engine).
 */
export async function GET(request: NextRequest) {
  const apiUrl = getFeatureFlagsApiUrl();
  const target = `${apiUrl}/evaluate${request.nextUrl.search}`;

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);

  try {
    const upstream = await fetch(target, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const payload = await upstream.arrayBuffer();
    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    return new NextResponse(payload, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { detail: "API'ye ulaşılamıyor. FastAPI servisinin çalıştığından emin olun." },
      { status: 502 },
    );
  }
}

import { NextResponse } from "next/server";
import { getFeatureFlagsApiUrl } from "@/lib/server-env";

/** Proxies FastAPI /health — used to wake Render free-tier cold starts. */
export async function GET() {
  const apiUrl = getFeatureFlagsApiUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const upstream = await fetch(`${apiUrl}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = await upstream.arrayBuffer();
    const headers = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    return new NextResponse(payload, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json(
      {
        status: "waking",
        detail:
          "API is waking up (cold start). This can take about 50 seconds on free hosting.",
      },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

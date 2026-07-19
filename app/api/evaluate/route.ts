import { NextRequest, NextResponse } from "next/server";
import { getFeatureFlagsApiUrl } from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";

/**
 * Proxies delivery evaluate for the signed-in admin "live test" panel.
 * Forwards only the project delivery api_key from Authorization — never the admin key.
 * Product backends should call FastAPI /evaluate directly, not this BFF route.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

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
      { detail: "Upstream API unreachable" },
      { status: 502 },
    );
  }
}

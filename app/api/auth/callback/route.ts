import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function resolveRedirectUrl(request: NextRequest, path: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  if (isLocal) {
    return new URL(path, request.nextUrl.origin).toString();
  }
  if (forwardedHost) {
    return `https://${forwardedHost}${path}`;
  }
  return new URL(path, request.nextUrl.origin).toString();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/projects";
  const next = nextParam.startsWith("/") ? nextParam : "/projects";

  if (!code) {
    return NextResponse.redirect(resolveRedirectUrl(request, "/login?error=auth"));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return NextResponse.redirect(
      resolveRedirectUrl(request, "/login?error=config"),
    );
  }

  // Cookies must be written onto this redirect response or the session is lost
  // and the browser looks stuck in a login / projects loop.
  const redirectResponse = NextResponse.redirect(
    resolveRedirectUrl(request, next),
  );

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback]", error.message);
    return NextResponse.redirect(
      resolveRedirectUrl(request, "/login?error=auth"),
    );
  }

  return redirectResponse;
}

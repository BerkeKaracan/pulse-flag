import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/callback") ||
    pathname.startsWith("/api/evaluate");

  if (isPublic) {
    if (pathname.startsWith("/login") && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/projects";
      url.search = "";
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
        redirectResponse.cookies.set(name, value);
      });
      return redirectResponse;
    }
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") {
      url.searchParams.set("callbackUrl", pathname);
    }
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      redirectResponse.cookies.set(name, value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Skip static assets. Keep /api/auth/callback in the matcher so the
     * session helper can still refresh cookies when needed, but auth gate
     * treats it as public.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

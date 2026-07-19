import "server-only";

import type { createClient } from "@/lib/supabase/server";

const REFRESH_IF_EXPIRES_WITHIN_SEC = 60;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Validate the user, then return an access token.
 * Refresh only when the token is missing or near expiry (avoids a Supabase
 * round-trip on every admin click).
 */
export async function resolveAccessToken(
  supabase: SupabaseServerClient,
): Promise<string | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const expiresAt = session?.expires_at;
  const nowSec = Math.floor(Date.now() / 1000);
  const needsRefresh =
    !session?.access_token ||
    typeof expiresAt !== "number" ||
    expiresAt <= nowSec + REFRESH_IF_EXPIRES_WITHIN_SEC;

  if (needsRefresh) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.data.session?.access_token) {
      return refreshed.data.session.access_token;
    }
  }

  return session?.access_token ?? null;
}

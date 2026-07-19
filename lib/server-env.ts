/** Server-only FastAPI connection settings — never expose to the browser. */

export function getFeatureFlagsApiUrl(): string {
  return (process.env.FEATURE_FLAGS_API_URL ?? "http://127.0.0.1:8002").replace(
    /\/$/,
    "",
  );
}

export function getFeatureFlagsAdminApiKey(): string {
  // Intentionally no NEXT_PUBLIC_* fallback — that would ship the admin key to clients.
  return process.env.FEATURE_FLAGS_ADMIN_API_KEY ?? "";
}

/** Server-only FastAPI connection settings (never expose to the browser). */

export function getFeatureFlagsApiUrl(): string {
  return (
    process.env.FEATURE_FLAGS_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8002"
  ).replace(/\/$/, "");
}

export function getFeatureFlagsAdminApiKey(): string {
  return (
    process.env.FEATURE_FLAGS_ADMIN_API_KEY ??
    process.env.NEXT_PUBLIC_ADMIN_API_KEY ??
    ""
  );
}

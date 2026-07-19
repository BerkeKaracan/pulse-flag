export type Project = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  api_key: string;
  created_at: string;
  updated_at: string;
};

export type TargetingRule = {
  id: string;
  feature_flag_id: string;
  name: string | null;
  priority: number;
  enabled: boolean;
  allowed_tenant_ids: string[];
  allowed_tiers: string[];
  created_at: string;
  updated_at: string;
};

export type FeatureFlag = {
  id: string;
  project_id: string;
  key: string;
  name: string;
  description: string | null;
  is_active: boolean;
  default_enabled: boolean;
  created_at: string;
  updated_at: string;
  rules: TargetingRule[];
};

export type EvaluateResult = {
  enabled: boolean;
};

function resolveAppOrigin(): string {
  if (typeof window !== "undefined") return "";
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://127.0.0.1:3001")
  );
}

function friendlyError(status: number, body: string): string {
  if (
    status === 502 ||
    body.includes("Upstream API unreachable") ||
    body.includes("API'ye ulaşılamıyor")
  ) {
    return "Upstream API unreachable. Check FEATURE_FLAGS_API_URL and that FastAPI is running.";
  }
  if (status === 401) {
    return "Unauthorized. Sign in again.";
  }
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    if (typeof parsed.detail === "string") return parsed.detail;
  } catch {
    // keep raw body
  }
  return body || `Request failed (${status})`;
}

async function cookieHeaderForServer(): Promise<string | undefined> {
  if (typeof window !== "undefined") return undefined;
  // Server Components must forward the browser session to the BFF.
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const parts = jar.getAll().map((c) => `${c.name}=${c.value}`);
  return parts.length > 0 ? parts.join("; ") : undefined;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${resolveAppOrigin()}/api/admin${path}`;

  const headersInit = new Headers(init?.headers);
  if (init?.body && !headersInit.has("Content-Type")) {
    headersInit.set("Content-Type", "application/json");
  }

  const cookieHeader = await cookieHeaderForServer();
  if (cookieHeader && !headersInit.has("Cookie")) {
    headersInit.set("Cookie", cookieHeader);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: headersInit,
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Upstream API unreachable. Check FEATURE_FLAGS_API_URL and that FastAPI is running.",
    );
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(friendlyError(res.status, body));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function evaluateFlag(input: {
  key: string;
  tenantId: string;
  tier?: string;
  apiKey?: string;
}): Promise<EvaluateResult> {
  const params = new URLSearchParams({
    key: input.key,
    tenant_id: input.tenantId,
  });
  if (input.tier) params.set("tier", input.tier);

  const headersInit = new Headers();
  if (input.apiKey) {
    headersInit.set("Authorization", `Bearer ${input.apiKey}`);
  }

  const cookieHeader = await cookieHeaderForServer();
  if (cookieHeader) {
    headersInit.set("Cookie", cookieHeader);
  }

  let res: Response;
  try {
    res = await fetch(`${resolveAppOrigin()}/api/evaluate?${params}`, {
      headers: headersInit,
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Upstream API unreachable. Check FEATURE_FLAGS_API_URL and that FastAPI is running.",
    );
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(friendlyError(res.status, body));
  }

  return res.json() as Promise<EvaluateResult>;
}

export const adminApi = {
  listProjects: () => api<Project[]>("/projects"),
  createProject: (body: { name: string; slug: string; description?: string }) =>
    api<Project>("/projects", { method: "POST", body: JSON.stringify(body) }),
  getProject: (projectId: string) => api<Project>(`/projects/${projectId}`),
  listFlags: (projectId: string) =>
    api<FeatureFlag[]>(`/projects/${projectId}/flags`),
  createFlag: (
    projectId: string,
    body: {
      key: string;
      name: string;
      description?: string;
      is_active?: boolean;
      default_enabled?: boolean;
    },
  ) =>
    api<FeatureFlag>(`/projects/${projectId}/flags`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getFlag: (projectId: string, flagId: string) =>
    api<FeatureFlag>(`/projects/${projectId}/flags/${flagId}`),
  createRule: (
    projectId: string,
    flagId: string,
    body: {
      name?: string;
      priority?: number;
      enabled?: boolean;
      allowed_tenant_ids?: string[];
      allowed_tiers?: string[];
    },
  ) =>
    api<TargetingRule>(`/projects/${projectId}/flags/${flagId}/rules`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteRule: (projectId: string, flagId: string, ruleId: string) =>
    api<void>(`/projects/${projectId}/flags/${flagId}/rules/${ruleId}`, {
      method: "DELETE",
    }),
};

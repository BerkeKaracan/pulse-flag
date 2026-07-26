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

export type ExplainResult = {
  enabled: boolean;
  reason: "flag_missing" | "flag_inactive" | "rule_match" | "default";
  project_id: string;
  flag_id: string | null;
  flag_key: string | null;
  matched_rule_id: string | null;
  rules_considered: number;
  normalized_tier: string | null;
};

export type EnsurePaidTiersResult = {
  flag_id: string;
  project_id: string;
  created_rule: boolean;
  updated_rule: boolean;
  rule_id: string;
  is_active: boolean;
};

/**
 * Client-safe admin API (BFF only).
 * Server Components should import from `@/lib/api.server` to skip the self-fetch hop.
 */
function friendlyError(status: number, body: string): string {
  if (
    status === 502 ||
    body.includes("Upstream API unreachable") ||
    body.includes("API'ye ulaşılamıyor")
  ) {
    return "Upstream API unreachable. Check FEATURE_FLAGS_API_URL and that FastAPI is running.";
  }
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail;
    }
  } catch {
    // keep raw body
  }
  if (status === 401) {
    return "Unauthorized. Sign in again.";
  }
  return body || `Request failed (${status})`;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `/api/admin${path}`;

  const headersInit = new Headers(init?.headers);
  if (init?.body && !headersInit.has("Content-Type")) {
    headersInit.set("Content-Type", "application/json");
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

  let res: Response;
  try {
    res = await fetch(`/api/evaluate?${params}`, {
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
  explainFlag: (
    projectId: string,
    flagId: string,
    tenantId: string,
    tier?: string,
  ) => {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (tier) params.set("tier", tier);
    return api<ExplainResult>(
      `/projects/${projectId}/flags/${flagId}/explain?${params}`,
    );
  },
  ensurePaidTiers: (projectId: string, flagId: string) =>
    api<EnsurePaidTiersResult>(
      `/projects/${projectId}/flags/${flagId}/ensure-paid-tiers`,
      { method: "POST" },
    ),
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

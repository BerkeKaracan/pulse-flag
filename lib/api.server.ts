import "server-only";

import { AdminUpstreamError, adminUpstreamJson } from "@/lib/admin-upstream";
import type { FeatureFlag, Project, TargetingRule } from "@/lib/api";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await adminUpstreamJson<T>(path, init);
  } catch (err) {
    if (err instanceof AdminUpstreamError) {
      throw new Error(err.message);
    }
    throw err;
  }
}

/** Server Components: call FastAPI directly (no `/api/admin` self-fetch). */
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

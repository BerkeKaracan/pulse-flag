import Link from "next/link";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { projectId } = await params;
  const { dict } = await getDictionary();
  const project = await adminApi.getProject(projectId);
  const evaluateBase =
    process.env.NEXT_PUBLIC_EVALUATE_PUBLIC_URL ??
    process.env.FEATURE_FLAGS_API_URL ??
    "http://127.0.0.1:8002";
  const curlExample = `curl "${evaluateBase.replace(/\/$/, "")}/evaluate?key=ai.canvas_generator&tenant_id=<TENANT_UUID>" \\
  -H "Authorization: Bearer ${project.api_key}"`;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {dict.projectDetail.label}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
          {project.name}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {project.description ?? dict.common.noDescription} · slug:{" "}
          {project.slug}
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white/85 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-800">
              {dict.projectDetail.apiKeyTitle}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {dict.projectDetail.apiKeyHint}
            </p>
          </div>
          <CopyButton
            value={project.api_key}
            label={dict.projectDetail.copyKey}
          />
        </div>
        <code className="block break-all rounded-xl bg-[var(--ink)] px-3 py-2 font-mono text-xs text-emerald-300">
          {project.api_key}
        </code>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-800">
          {dict.projectDetail.curlTitle}
        </p>
        <pre className="overflow-x-auto rounded-xl bg-[var(--ink)] p-3 font-mono text-[11px] leading-5 text-zinc-100">
          {curlExample}
        </pre>
        <CopyButton value={curlExample} label={dict.projectDetail.copyCurl} />
      </div>

      <div className="rounded-xl border border-teal-900/10 bg-teal-50/80 px-4 py-3 text-sm text-teal-950">
        <strong>{dict.projectDetail.nextStep}</strong>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/projects/${project.id}/flags`}>
          <Button>{dict.projectDetail.manageFlags}</Button>
        </Link>
        <Link href={`/projects/${project.id}/flags/new`}>
          <Button variant="secondary">{dict.projectDetail.createFlag}</Button>
        </Link>
      </div>
    </div>
  );
}

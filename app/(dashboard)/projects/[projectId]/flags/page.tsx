import Link from "next/link";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function FlagsPage({ params }: Props) {
  const { projectId } = await params;
  const [project, flags] = await Promise.all([
    adminApi.getProject(projectId),
    adminApi.listFlags(projectId),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            {project.name}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-zinc-900">
            Feature flags
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            SaaS Engine’in sorduğu key listesi. Örnek:{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
              ai.canvas_generator
            </code>
          </p>
        </div>
        <Link href={`/projects/${projectId}/flags/new`}>
          <Button>Flag oluştur</Button>
        </Link>
      </div>

      <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
        {flags.length === 0 ? (
          <li className="space-y-3 py-8">
            <p className="text-sm text-zinc-600">
              Henüz flag yok. Adım 2: <code>ai.canvas_generator</code> key’ini oluştur.
            </p>
            <Link href={`/projects/${projectId}/flags/new`}>
              <Button>İlk flag’i oluştur</Button>
            </Link>
          </li>
        ) : null}
        {flags.map((flag) => (
          <li key={flag.id} className="flex items-center justify-between gap-4 py-4">
            <div>
              <Link
                href={`/projects/${projectId}/flags/${flag.id}`}
                className="font-mono text-sm font-medium text-teal-800 hover:underline"
              >
                {flag.key}
              </Link>
              <p className="mt-1 text-sm text-zinc-700">{flag.name}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {flag.rules.length} rule ·{" "}
                {flag.is_active ? "aktif" : "pasif"} · varsayılan{" "}
                {flag.default_enabled ? "açık" : "kapalı"}
              </p>
            </div>
            <Link href={`/projects/${projectId}/flags/${flag.id}`}>
              <Button variant="secondary">Rule + test</Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

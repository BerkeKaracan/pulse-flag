import Link from "next/link";
import { adminApi } from "@/lib/api.server";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function FlagsPage({ params }: Props) {
  const { projectId } = await params;
  const { dict } = await getDictionary();
  const [project, flags] = await Promise.all([
    adminApi.getProject(projectId),
    adminApi.listFlags(projectId),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {project.name}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
            {dict.flags.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {dict.flags.subtitle}{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
              ai.canvas_generator
            </code>
          </p>
        </div>
        <Link href={`/projects/${projectId}/flags/new`}>
          <Button>{dict.flags.create}</Button>
        </Link>
      </div>

      <ul className="divide-y divide-zinc-200/80 overflow-hidden rounded-2xl border border-zinc-200 bg-white/70">
        {flags.length === 0 ? (
          <li className="space-y-3 px-5 py-8">
            <p className="text-sm text-zinc-600">{dict.flags.empty}</p>
            <Link href={`/projects/${projectId}/flags/new`}>
              <Button>{dict.flags.createFirst}</Button>
            </Link>
          </li>
        ) : null}
        {flags.map((flag) => (
          <li
            key={flag.id}
            className="flex items-center justify-between gap-4 px-5 py-4"
          >
            <div>
              <Link
                href={`/projects/${projectId}/flags/${flag.id}`}
                className="font-mono text-sm font-semibold text-teal-800 hover:underline"
              >
                {flag.key}
              </Link>
              <p className="mt-1 text-sm text-zinc-700">{flag.name}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {flag.rules.length} {dict.flags.rulesCount} ·{" "}
                {flag.is_active ? dict.common.active : dict.common.inactive} ·{" "}
                {dict.flagDetail.default}{" "}
                {flag.default_enabled ? dict.common.open : dict.common.closed}
              </p>
            </div>
            <Link href={`/projects/${projectId}/flags/${flag.id}`}>
              <Button variant="secondary">{dict.flags.ruleTest}</Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

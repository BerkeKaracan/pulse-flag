import Link from "next/link";
import { adminApi } from "@/lib/api.server";
import { Button } from "@/components/ui/button";
import { HowItWorks } from "@/components/how-it-works";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function ProjectsPage() {
  const { dict } = await getDictionary();
  let projects: Awaited<ReturnType<typeof adminApi.listProjects>> = [];
  let error: string | null = null;

  try {
    projects = await adminApi.listProjects();
  } catch (e) {
    error = e instanceof Error ? e.message : dict.projects.loadError;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
            {dict.projects.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
            {dict.projects.subtitle}{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">
              GET /evaluate
            </code>
            .
          </p>
        </div>
        <Link href="/projects/new">
          <Button>{dict.projects.newProject}</Button>
        </Link>
      </div>

      <HowItWorks />

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {dict.projects.apiUnavailable}
          <div className="mt-1 font-mono text-xs opacity-80">{error}</div>
        </div>
      ) : null}

      <ul className="divide-y divide-zinc-200/80 overflow-hidden rounded-2xl border border-zinc-200 bg-white/70">
        {projects.length === 0 && !error ? (
          <li className="space-y-3 px-5 py-8">
            <p className="text-sm text-zinc-600">{dict.projects.empty}</p>
            <Link href="/projects/new">
              <Button>{dict.projects.createFirst}</Button>
            </Link>
          </li>
        ) : null}
        {projects.map((project) => (
          <li
            key={project.id}
            className="flex items-center justify-between gap-4 px-5 py-4"
          >
            <div>
              <Link
                href={`/projects/${project.id}`}
                className="font-semibold text-zinc-900 hover:text-teal-800"
              >
                {project.name}
              </Link>
              <p className="mt-1 text-xs text-zinc-500">slug: {project.slug}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/projects/${project.id}`}>
                <Button variant="ghost">{dict.projects.detail}</Button>
              </Link>
              <Link href={`/projects/${project.id}/flags`}>
                <Button variant="secondary">{dict.projects.flags}</Button>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

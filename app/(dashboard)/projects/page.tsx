import Link from "next/link";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { HowItWorks } from "@/components/how-it-works";

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof adminApi.listProjects>> = [];
  let error: string | null = null;

  try {
    projects = await adminApi.listProjects();
  } catch (e) {
    error = e instanceof Error ? e.message : "Projeler yüklenemedi";
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-zinc-900">
            Projeler
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
            Feature flag kullanacak ürünleri (ör. SaaS Engine) burada kaydedin.
            Sonra flag ve rule ekleyip <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">GET /evaluate</code> ile test edin.
          </p>
        </div>
        <Link href="/projects/new">
          <Button>Yeni project</Button>
        </Link>
      </div>

      <HowItWorks />

      {error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          API’ye ulaşılamıyor. FastAPI’nin çalıştığından emin olun, sonra sayfayı yenileyin.
          <div className="mt-1 font-mono text-xs opacity-80">{error}</div>
        </div>
      ) : null}

      <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
        {projects.length === 0 && !error ? (
          <li className="space-y-3 py-8">
            <p className="text-sm text-zinc-600">
              Henüz project yok. İlk adım: SaaS Engine’i kaydet.
            </p>
            <Link href="/projects/new">
              <Button>İlk project’i oluştur</Button>
            </Link>
          </li>
        ) : null}
        {projects.map((project) => (
          <li key={project.id} className="flex items-center justify-between gap-4 py-4">
            <div>
              <Link
                href={`/projects/${project.id}`}
                className="font-medium text-zinc-900 hover:text-teal-800"
              >
                {project.name}
              </Link>
              <p className="mt-1 text-xs text-zinc-500">slug: {project.slug}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/projects/${project.id}`}>
                <Button variant="ghost">Detay</Button>
              </Link>
              <Link href={`/projects/${project.id}/flags`}>
                <Button variant="secondary">Flags</Button>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

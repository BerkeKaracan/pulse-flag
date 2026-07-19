import Link from "next/link";

export function DashboardNav() {
  const apiUrl = process.env.FEATURE_FLAGS_API_URL ?? "http://127.0.0.1:8002";
  const docsUrl =
    process.env.NEXT_PUBLIC_API_DOCS_URL ?? `${apiUrl.replace(/\/$/, "")}/docs`;

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link
          href="/projects"
          className="font-[family-name:var(--font-display)] text-lg tracking-tight text-zinc-900"
        >
          Pulse Flag
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-600">
          <Link href="/projects" className="hover:text-zinc-900">
            Projeler
          </Link>
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-900"
          >
            API Docs
          </a>
        </nav>
      </div>
    </header>
  );
}

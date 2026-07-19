import Link from "next/link";
import { auth } from "@/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function DashboardNav() {
  const { dict } = await getDictionary();
  const session = await auth();
  const apiUrl = process.env.FEATURE_FLAGS_API_URL ?? "http://127.0.0.1:8002";
  const docsUrl =
    process.env.NEXT_PUBLIC_API_DOCS_URL ?? `${apiUrl.replace(/\/$/, "")}/docs`;

  return (
    <header className="border-b border-zinc-200/80 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link
          href="/projects"
          className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]"
        >
          Pulse Flag
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-600">
          <Link href="/projects" className="hover:text-zinc-900">
            {dict.nav.projects}
          </Link>
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-900"
          >
            {dict.nav.apiDocs}
          </a>
          <LocaleSwitcher />
          {session?.user?.email ? (
            <div className="flex items-center gap-2 border-l border-zinc-200 pl-4">
              <span className="max-w-[12rem] truncate text-xs text-zinc-500">
                {session.user.email}
              </span>
              <SignOutButton label={dict.nav.signOut} />
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

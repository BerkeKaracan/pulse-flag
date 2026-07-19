import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LocaleProvider } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { isAdminEmail } from "@/lib/admin-emails";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (isAdminEmail(session?.user?.email)) {
    redirect("/projects");
  }

  const { error, callbackUrl } = await searchParams;
  const { dict, locale } = await getDictionary();
  const redirectTo =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/projects";
  const showDenied = error === "AccessDenied" || error === "Configuration";

  return (
    <LocaleProvider locale={locale}>
      <div className="flex min-h-full flex-col bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f4f6f3_42%,_#eef1ec_100%)]">
        <header className="border-b border-zinc-200/80 bg-white/75 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
            <Link
              href="/login"
              className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]"
            >
              Pulse Flag
            </Link>
            <LocaleSwitcher />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
            {dict.login.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">{dict.login.subtitle}</p>

          {showDenied ? (
            <p
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {error === "Configuration"
                ? dict.login.configError
                : dict.login.accessDenied}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo });
              }}
            >
              <Button type="submit" className="w-full" variant="secondary">
                {dict.login.google}
              </Button>
            </form>
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo });
              }}
            >
              <Button type="submit" className="w-full" variant="secondary">
                {dict.login.github}
              </Button>
            </form>
          </div>

          <p className="mt-8 text-xs text-zinc-500">{dict.login.hint}</p>
        </main>
      </div>
    </LocaleProvider>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/dictionaries";
import { useDictionary } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const router = useRouter();
  const { locale } = useDictionary();
  const [pending, startTransition] = useTransition();

  function setLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 p-0.5 text-xs font-medium"
      aria-label="Language"
    >
      {(["en", "tr"] as const).map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          onClick={() => setLocale(code)}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors",
            locale === code
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-900",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

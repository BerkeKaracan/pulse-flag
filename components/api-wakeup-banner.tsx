"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDictionary } from "@/components/locale-provider";
import { Spinner } from "@/components/ui/spinner";

const SHOW_AFTER_MS = 1200;
const POLL_MS = 2500;
const EXPECTED_SECONDS = 50;

/**
 * On first paint: ping /api/health to wake Render.
 * If the API is slow (cold start), show a ~50s user warning.
 */
export function ApiWakeupBanner() {
  const { dict } = useDictionary();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const showTimer = setTimeout(() => {
      if (!cancelled) setVisible(true);
    }, SHOW_AFTER_MS);

    const elapsedTimer = setInterval(() => {
      if (!cancelled) {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }
    }, 1000);

    async function ping() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          clearTimeout(showTimer);
          const waited = Date.now() - startedAt;
          setReady(true);
          setVisible(false);
          if (waited >= SHOW_AFTER_MS) {
            router.refresh();
          }
          return;
        }
      } catch {
        // keep polling
      }

      if (!cancelled) {
        pollTimer = setTimeout(ping, POLL_MS);
      }
    }

    void ping();

    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearTimeout(pollTimer);
      clearInterval(elapsedTimer);
    };
  }, [router]);

  if (!visible || ready) return null;

  const remaining = Math.max(0, EXPECTED_SECONDS - elapsed);

  return (
    <div
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-5xl items-start gap-3">
        <Spinner className="mt-0.5 size-4 shrink-0 border-2 text-amber-800" />
        <div className="min-w-0 text-sm leading-5">
          <p className="font-semibold">{dict.wakeup.title}</p>
          <p className="mt-1 text-amber-900/90">{dict.wakeup.body}</p>
          <p className="mt-1 font-mono text-xs text-amber-800/80">
            {dict.wakeup.timer
              .replace("{elapsed}", String(elapsed))
              .replace("{remaining}", String(remaining))}
          </p>
        </div>
      </div>
    </div>
  );
}

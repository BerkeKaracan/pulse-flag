"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        This page couldn’t load
      </h1>
      <p className="text-sm text-zinc-600">
        {error.message || "A server error occurred. Reload to try again."}
      </p>
      <Button type="button" onClick={reset}>
        Reload
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type LoginButtonsProps = {
  googleLabel: string;
  githubLabel: string;
  nextPath: string;
};

export function LoginButtons({
  googleLabel,
  githubLabel,
  nextPath,
}: LoginButtonsProps) {
  const [pending, setPending] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: "google" | "github") {
    setPending(provider);
    setError(null);

    try {
      const supabase = createClient();
      const redirectTo = new URL("/api/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", nextPath);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo.toString(),
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setPending(null);
        return;
      }

      if (!data.url) {
        setError("OAuth URL could not be created.");
        setPending(null);
        return;
      }

      // Hard navigation — avoids stuck "…" if the SDK redirect is blocked.
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        className="w-full"
        variant="secondary"
        disabled={pending !== null}
        onClick={() => void signIn("google")}
      >
        {pending === "google" ? "…" : googleLabel}
      </Button>
      <Button
        type="button"
        className="w-full"
        variant="secondary"
        disabled={pending !== null}
        onClick={() => void signIn("github")}
      >
        {pending === "github" ? "…" : githubLabel}
      </Button>
    </div>
  );
}

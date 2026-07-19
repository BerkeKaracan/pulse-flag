"use client";

import { useState, type FormEvent } from "react";
import { evaluateFlag } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDictionary } from "@/components/locale-provider";

type Props = {
  flagKey: string;
  apiKey: string;
};

export function EvaluateTester({ flagKey, apiKey }: Props) {
  const { dict } = useDictionary();
  const [tenantId, setTenantId] = useState("");
  const [tier, setTier] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const data = await evaluateFlag({
        key: flagKey,
        tenantId: tenantId.trim(),
        tier: tier.trim() || undefined,
        apiKey,
      });
      setResult(data.enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.evaluate.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white/85 p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          {dict.evaluate.title}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          {dict.evaluate.subtitle}{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs">
            {'{ "enabled": true|false }'}
          </code>
          .
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="test-tenant">{dict.evaluate.tenant}</Label>
          <Input
            id="test-tenant"
            className="font-mono text-xs"
            placeholder="11111111-1111-1111-1111-111111111111"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="test-tier">{dict.evaluate.tier}</Label>
          <Input
            id="test-tier"
            placeholder="pro"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            loading={pending}
            className="w-full sm:w-auto"
          >
            {pending ? dict.evaluate.querying : dict.evaluate.submit}
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {result !== null ? (
        <div
          className={
            result
              ? "rounded-lg bg-teal-50 px-3 py-2 font-mono text-sm text-teal-900"
              : "rounded-lg bg-zinc-100 px-3 py-2 font-mono text-sm text-zinc-700"
          }
        >
          {`{ "enabled": ${result} }`}
        </div>
      ) : null}
    </section>
  );
}

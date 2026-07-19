"use client";

import { useState, type FormEvent } from "react";
import { evaluateFlag } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  flagKey: string;
  apiKey: string;
};

export function EvaluateTester({ flagKey, apiKey }: Props) {
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
      setError(err instanceof Error ? err.message : "Test başarısız");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white/80 p-5">
      <div>
        <h2 className="text-lg font-medium text-zinc-900">Canlı test</h2>
        <p className="mt-1 text-sm text-zinc-600">
          SaaS Engine’in soracağı çağrıyı burada dene. Sonuç her zaman{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs">
            {'{ "enabled": true|false }'}
          </code>{" "}
          formatındadır.
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="test-tenant">tenant_id (workspace UUID)</Label>
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
          <Label htmlFor="test-tier">tier (opsiyonel)</Label>
          <Input
            id="test-tier"
            placeholder="pro"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Sorgulanıyor…" : "Evaluate et"}
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {result !== null ? (
        <div
          className={
            result
              ? "rounded-md bg-teal-50 px-3 py-2 font-mono text-sm text-teal-900"
              : "rounded-md bg-zinc-100 px-3 py-2 font-mono text-sm text-zinc-700"
          }
        >
          {`{ "enabled": ${result} }`}
        </div>
      ) : null}
    </section>
  );
}

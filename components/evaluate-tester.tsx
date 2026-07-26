"use client";

import { useState, type FormEvent } from "react";
import { adminApi, evaluateFlag, type ExplainResult } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDictionary } from "@/components/locale-provider";

type Props = {
  projectId: string;
  flagId: string;
  flagKey: string;
  apiKey: string;
};

const TIER_PRESETS = ["basic", "advanced", "pro"] as const;

export function EvaluateTester({
  projectId,
  flagId,
  flagKey,
  apiKey,
}: Props) {
  const { dict } = useDictionary();
  const [tenantId, setTenantId] = useState(
    "00000000-0000-4000-8000-000000000001",
  );
  const [tier, setTier] = useState("advanced");
  const [result, setResult] = useState<boolean | null>(null);
  const [explain, setExplain] = useState<ExplainResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(withExplain: boolean) {
    setPending(true);
    setError(null);
    setResult(null);
    setExplain(null);
    try {
      const data = await evaluateFlag({
        key: flagKey,
        tenantId: tenantId.trim(),
        tier: tier.trim() || undefined,
        apiKey,
      });
      setResult(data.enabled);

      if (withExplain) {
        const breakdown = await adminApi.explainFlag(
          projectId,
          flagId,
          tenantId.trim(),
          tier.trim() || undefined,
        );
        setExplain(breakdown);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.evaluate.error);
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await run(true);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white/85 p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          {dict.evaluate.title}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          {dict.evaluate.subtitle}{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">
            {'{ "enabled": true|false }'}
          </code>
        </p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="test-tenant">{dict.evaluate.tenant}</Label>
          <Input
            id="test-tenant"
            className="font-mono text-xs"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="test-tier">{dict.evaluate.tier}</Label>
          <Input
            id="test-tier"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            placeholder="advanced"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {TIER_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTier(preset)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  tier === preset
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-teal-600"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
        ) : null}
        {result !== null ? (
          <p className="font-mono text-sm text-zinc-800 sm:col-span-2">
            {`{ "enabled": ${result} }`}
          </p>
        ) : null}
        {explain ? (
          <div className="sm:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 space-y-1">
            <p>
              <span className="font-semibold">{dict.evaluate.explainReason}:</span>{" "}
              {explain.reason}
            </p>
            <p>
              <span className="font-semibold">project_id:</span>{" "}
              <span className="font-mono">{explain.project_id}</span>
            </p>
            {explain.matched_rule_id ? (
              <p>
                <span className="font-semibold">
                  {dict.evaluate.explainMatchedRule}:
                </span>{" "}
                <span className="font-mono">{explain.matched_rule_id}</span>
              </p>
            ) : null}
            <p>
              {dict.evaluate.explainRulesConsidered}: {explain.rules_considered}
              {explain.normalized_tier
                ? ` · tier=${explain.normalized_tier}`
                : ""}
            </p>
          </div>
        ) : null}
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <Button type="submit" loading={pending}>
            {pending ? dict.evaluate.querying : dict.evaluate.submit}
          </Button>
        </div>
      </form>
    </section>
  );
}

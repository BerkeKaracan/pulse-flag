"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDictionary } from "@/components/locale-provider";

type Props = {
  projectId: string;
  flagId: string;
};

export function AddRuleForm({ projectId, flagId }: Props) {
  const router = useRouter();
  const { dict } = useDictionary();
  const [name, setName] = useState("");
  const [priority, setPriority] = useState("100");
  const [enabled, setEnabled] = useState(true);
  const [tenantIds, setTenantIds] = useState("");
  const [tiers, setTiers] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const allowed_tenant_ids = tenantIds
      .split(/[\s,]+/)
      .map((v) => v.trim())
      .filter(Boolean);
    const allowed_tiers = tiers
      .split(/[\s,]+/)
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
      .map((v) => (v === "free" ? "basic" : v));

    if (allowed_tenant_ids.length === 0 && allowed_tiers.length === 0) {
      setError(dict.addRule.requireConstraint);
      setPending(false);
      return;
    }

    try {
      await adminApi.createRule(projectId, flagId, {
        name: name || undefined,
        priority: Number(priority) || 100,
        enabled,
        allowed_tenant_ids,
        allowed_tiers,
      });
      setTenantIds("");
      setTiers("");
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.addRule.error);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white/85 p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
          {dict.addRule.step}
        </p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-900">
          {dict.addRule.title}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">{dict.addRule.subtitle}</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="rule-name">{dict.addRule.name}</Label>
          <Input
            id="rule-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tenants">{dict.addRule.tenants}</Label>
          <Input
            id="tenants"
            className="font-mono text-xs"
            placeholder={dict.addRule.tenantsPlaceholder}
            value={tenantIds}
            onChange={(e) => setTenantIds(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tiers">{dict.addRule.tiers}</Label>
          <Input
            id="tiers"
            placeholder={dict.addRule.tiersPlaceholder}
            value={tiers}
            onChange={(e) => setTiers(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">{dict.addRule.priority}</Label>
          <Input
            id="priority"
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            {dict.addRule.enableOnMatch}
          </label>
        </div>
        {error ? (
          <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? dict.common.saving : dict.addRule.submit}
          </Button>
        </div>
      </form>
    </section>
  );
}

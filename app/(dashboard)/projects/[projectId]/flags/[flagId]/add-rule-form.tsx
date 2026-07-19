"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  projectId: string;
  flagId: string;
};

export function AddRuleForm({ projectId, flagId }: Props) {
  const router = useRouter();
  const [name, setName] = useState("İzin verilen workspace’ler");
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
    try {
      await adminApi.createRule(projectId, flagId, {
        name: name || undefined,
        priority: Number(priority) || 100,
        enabled,
        allowed_tenant_ids: tenantIds
          .split(/[\s,]+/)
          .map((v) => v.trim())
          .filter(Boolean),
        allowed_tiers: tiers
          .split(/[\s,]+/)
          .map((v) => v.trim())
          .filter(Boolean),
      });
      setTenantIds("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rule eklenemedi");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white/80 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-teal-700">
          Adım 3 / 3
        </p>
        <h2 className="mt-2 text-lg font-medium text-zinc-900">
          Kimler için açılsın?
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Boş bıraktığın alan “herkes” demektir. En az bir tenant_id veya tier
          yazman önerilir.
        </p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="rule-name">Rule adı</Label>
          <Input
            id="rule-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tenants">tenant_id listesi (virgülle)</Label>
          <Input
            id="tenants"
            className="font-mono text-xs"
            placeholder="Supabase workspace UUID"
            value={tenantIds}
            onChange={(e) => setTenantIds(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="tiers">allowed_tiers (virgülle, opsiyonel)</Label>
          <Input
            id="tiers"
            placeholder="advanced,pro"
            value={tiers}
            onChange={(e) => setTiers(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">priority (düşük = önce)</Label>
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
            Eşleşince özelliği aç
          </label>
        </div>
        {error ? (
          <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor…" : "Rule ekle"}
          </Button>
        </div>
      </form>
    </section>
  );
}

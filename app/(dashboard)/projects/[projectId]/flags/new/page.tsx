"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewFlagPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [key, setKey] = useState("ai.canvas_generator");
  const [name, setName] = useState("AI Canvas Generator");
  const [description, setDescription] = useState(
    "AI canvas generator özelliğini kontrol eder",
  );
  const [defaultEnabled, setDefaultEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const flag = await adminApi.createFlag(projectId, {
        key,
        name,
        description: description || undefined,
        default_enabled: defaultEnabled,
        is_active: true,
      });
      router.push(`/projects/${projectId}/flags/${flag.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Flag oluşturulamadı");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-teal-700">
          Adım 2 / 3
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-zinc-900">
          Feature flag oluştur
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Key sabittir; SaaS Engine kodunda aynı string’i kullan. Değiştirmek
          entegrasyonu kırar.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="key">key</Label>
          <Input
            id="key"
            className="font-mono"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Görünen isim</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={defaultEnabled}
            onChange={(e) => setDefaultEnabled(e.target.checked)}
          />
          Hiçbir rule eşleşmezse varsayılan olarak açık olsun
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Oluşturuluyor…" : "Flag oluştur"}
        </Button>
      </form>
    </div>
  );
}

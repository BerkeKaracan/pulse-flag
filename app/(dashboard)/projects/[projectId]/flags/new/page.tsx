"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDictionary } from "@/components/locale-provider";

export default function NewFlagPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const { dict } = useDictionary();

  const [key, setKey] = useState("ai.canvas_generator");
  const [name, setName] = useState("AI Canvas Generator");
  const [description, setDescription] = useState("");
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
      // Keep spinner until navigation completes.
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.newFlag.error);
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
          {dict.newFlag.step}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
          {dict.newFlag.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {dict.newFlag.subtitle}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white/85 p-5 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="key">{dict.newFlag.key}</Label>
          <Input
            id="key"
            className="font-mono"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">{dict.newFlag.displayName}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{dict.newFlag.description}</Label>
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
          {dict.newFlag.defaultEnabled}
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" loading={pending}>
          {pending ? dict.common.creating : dict.newFlag.submit}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("SaaS Engine");
  const [slug, setSlug] = useState("saas-engine");
  const [description, setDescription] = useState(
    "Feature flag tüketen ana ürün",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const project = await adminApi.createProject({
        name,
        slug: slug || slugify(name),
        description: description || undefined,
      });
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Project oluşturulamadı");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-teal-700">
          Adım 1 / 3
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-zinc-900">
          Project kaydet
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Bu, <code className="rounded bg-zinc-100 px-1 text-xs">GET /evaluate</code>{" "}
          çağıracak ürün. Kayıttan sonra bir delivery <code className="rounded bg-zinc-100 px-1 text-xs">api_key</code> alırsın.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">İsim</Label>
          <Input
            id="name"
            placeholder="SaaS Engine"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug || slug === slugify(name)) setSlug(slugify(e.target.value));
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            placeholder="saas-engine"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
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
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Project oluştur"}
        </Button>
      </form>
    </div>
  );
}

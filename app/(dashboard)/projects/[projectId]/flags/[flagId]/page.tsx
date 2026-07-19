import { adminApi } from "@/lib/api";
import { AddRuleForm } from "./add-rule-form";
import { DeleteRuleButton } from "./delete-rule-button";
import { EvaluateTester } from "@/components/evaluate-tester";

type Props = {
  params: Promise<{ projectId: string; flagId: string }>;
};

export default async function FlagDetailPage({ params }: Props) {
  const { projectId, flagId } = await params;
  const [project, flag] = await Promise.all([
    adminApi.getProject(projectId),
    adminApi.getFlag(projectId, flagId),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-sm text-teal-800">{flag.key}</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-zinc-900">
          {flag.name}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {flag.description ?? "Açıklama yok"} · varsayılan{" "}
          {flag.default_enabled ? "açık" : "kapalı"}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-zinc-900">Targeting rules</h2>
        <p className="text-sm text-zinc-600">
          İlk eşleşen rule (priority’ye göre) kazanır. Eşleşme yoksa flag
          varsayılanı kullanılır.
        </p>

        <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
          {flag.rules.length === 0 ? (
            <li className="py-6 text-sm text-zinc-500">
              Henüz rule yok. Evaluate şu an varsayılana düşer (
              {flag.default_enabled ? "açık" : "kapalı"}).
            </li>
          ) : null}
          {flag.rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-start justify-between gap-4 py-4"
            >
              <div className="space-y-1 text-sm">
                <p className="font-medium text-zinc-900">
                  {rule.name || "İsimsiz rule"} · priority {rule.priority} ·{" "}
                  <span
                    className={
                      rule.enabled ? "text-teal-700" : "text-zinc-500"
                    }
                  >
                    {rule.enabled ? "aç" : "kapat"}
                  </span>
                </p>
                <p className="text-zinc-600">
                  tenant_id:{" "}
                  {rule.allowed_tenant_ids.length
                    ? rule.allowed_tenant_ids.join(", ")
                    : "herhangi"}
                </p>
                <p className="text-zinc-600">
                  tiers:{" "}
                  {rule.allowed_tiers.length
                    ? rule.allowed_tiers.join(", ")
                    : "herhangi"}
                </p>
              </div>
              <DeleteRuleButton
                projectId={projectId}
                flagId={flagId}
                ruleId={rule.id}
              />
            </li>
          ))}
        </ul>
      </section>

      <AddRuleForm projectId={projectId} flagId={flagId} />

      <EvaluateTester flagKey={flag.key} apiKey={project.api_key} />
    </div>
  );
}

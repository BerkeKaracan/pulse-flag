import { adminApi } from "@/lib/api.server";
import { AddRuleForm } from "./add-rule-form";
import { DeleteRuleButton } from "./delete-rule-button";
import { EvaluateTester } from "@/components/evaluate-tester";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Props = {
  params: Promise<{ projectId: string; flagId: string }>;
};

export default async function FlagDetailPage({ params }: Props) {
  const { projectId, flagId } = await params;
  const { dict } = await getDictionary();
  const [project, flag] = await Promise.all([
    adminApi.getProject(projectId),
    adminApi.getFlag(projectId, flagId),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-sm text-teal-800">{flag.key}</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
          {flag.name}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          {flag.description ?? dict.common.noDescription} ·{" "}
          {dict.flagDetail.default}{" "}
          {flag.default_enabled ? dict.common.open : dict.common.closed}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">
          {dict.flagDetail.rulesTitle}
        </h2>
        <p className="text-sm text-zinc-600">{dict.flagDetail.rulesHint}</p>

        <ul className="divide-y divide-zinc-200/80 overflow-hidden rounded-2xl border border-zinc-200 bg-white/70">
          {flag.rules.length === 0 ? (
            <li className="px-5 py-6 text-sm text-zinc-500">
              {dict.flagDetail.emptyRules} (
              {flag.default_enabled ? dict.common.open : dict.common.closed}).
            </li>
          ) : null}
          {flag.rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-start justify-between gap-4 px-5 py-4"
            >
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-zinc-900">
                  {rule.name || dict.common.unnamedRule} · priority{" "}
                  {rule.priority} ·{" "}
                  <span
                    className={
                      rule.enabled ? "text-teal-700" : "text-zinc-500"
                    }
                  >
                    {rule.enabled ? dict.common.on : dict.common.off}
                  </span>
                </p>
                <p className="text-zinc-600">
                  tenant_id:{" "}
                  {rule.allowed_tenant_ids.length
                    ? rule.allowed_tenant_ids.join(", ")
                    : rule.allowed_tiers.length
                      ? dict.common.any
                      : dict.common.none}
                </p>
                <p className="text-zinc-600">
                  tiers:{" "}
                  {rule.allowed_tiers.length
                    ? rule.allowed_tiers.join(", ")
                    : rule.allowed_tenant_ids.length
                      ? dict.common.any
                      : dict.common.none}
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

import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function HowItWorks() {
  const { dict } = await getDictionary();

  return (
    <section className="rounded-2xl border border-teal-900/10 bg-white/80 p-6 shadow-[0_18px_40px_-28px_rgba(15,118,110,0.45)]">
      <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
        {dict.howItWorks.title}
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">
        {dict.howItWorks.subtitle}
      </p>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {dict.howItWorks.steps.map((step) => (
          <li
            key={step.title}
            className="rounded-xl border border-teal-900/5 bg-[linear-gradient(180deg,#f0fdfa_0%,#ffffff_100%)] px-4 py-3"
          >
            <p className="text-sm font-semibold text-teal-900">{step.title}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-600">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

const steps = [
  {
    title: "1. Project",
    body: "SaaS Engine gibi çağıracak ürünü kaydedin. Size bir delivery api_key verilir.",
  },
  {
    title: "2. Flag",
    body: "Sabit bir key oluşturun (örn. ai.canvas_generator). Motor bu key’i sorar.",
  },
  {
    title: "3. Rule",
    body: "Hangi tenant_id veya tier için açık olacağını tanımlayın.",
  },
  {
    title: "4. Evaluate",
    body: "SaaS Engine GET /evaluate çağırır; cevap her zaman { \"enabled\": true|false }.",
  },
];

export function HowItWorks() {
  return (
    <section className="rounded-xl border border-teal-200/80 bg-white/70 p-5 shadow-sm shadow-teal-900/5">
      <h2 className="font-[family-name:var(--font-display)] text-lg text-zinc-900">
        Sistem nasıl çalışır?
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Pulse Flag karar verir; SaaS Engine sadece sonucu uygular. Panel yalnızca yönetici içindir.
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.title} className="rounded-lg bg-teal-50/70 px-3 py-3">
            <p className="text-sm font-medium text-teal-900">{step.title}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-600">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

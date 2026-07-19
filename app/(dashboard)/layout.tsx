import { DashboardNav } from "@/components/dashboard-nav";
import { LocaleProvider } from "@/components/locale-provider";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = await getDictionary();

  return (
    <LocaleProvider locale={locale}>
      <div className="min-h-full bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f4f6f3_42%,_#eef1ec_100%)]">
        <DashboardNav />
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </div>
    </LocaleProvider>
  );
}

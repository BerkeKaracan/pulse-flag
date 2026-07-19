import { Spinner } from "@/components/ui/spinner";

export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[45vh] flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <Spinner className="size-8 border-[3px] text-teal-800" label="Loading" />
      <p className="text-sm font-medium text-zinc-600">Loading…</p>
    </div>
  );
}

import { Spinner } from "@/components/ui/spinner";

export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[45vh] flex-col items-center justify-center gap-3 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <Spinner className="size-8 border-[3px] text-teal-800" label="Loading" />
      <p className="text-sm font-medium text-zinc-600">Loading…</p>
      <p className="max-w-sm text-xs leading-5 text-zinc-500">
        If the API was asleep (Render free tier), the first load can take about
        50 seconds.
      </p>
    </div>
  );
}

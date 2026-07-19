import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton({ label }: { label: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button type="submit" variant="ghost" className="h-8 px-2 text-sm font-medium">
        {label}
      </Button>
    </form>
  );
}

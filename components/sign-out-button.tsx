import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export function SignOutButton({ label }: { label: string }) {
  return (
    <form
      action={async () => {
        "use server";
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect("/login");
      }}
    >
      <Button type="submit" variant="ghost" className="h-8 px-2 text-sm font-medium">
        {label}
      </Button>
    </form>
  );
}

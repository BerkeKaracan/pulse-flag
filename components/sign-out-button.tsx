import { redirect } from "next/navigation";
import { SignOutSubmit } from "@/components/sign-out-submit";
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
      <SignOutSubmit label={label} />
    </form>
  );
}

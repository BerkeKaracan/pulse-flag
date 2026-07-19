"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SignOutSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      loading={pending}
      className="h-8 px-2 text-sm font-medium"
    >
      {label}
    </Button>
  );
}

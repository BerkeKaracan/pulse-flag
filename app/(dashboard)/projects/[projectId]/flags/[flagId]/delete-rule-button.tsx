"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Props = {
  projectId: string;
  flagId: string;
  ruleId: string;
};

export function DeleteRuleButton({ projectId, flagId, ruleId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    try {
      await adminApi.deleteRule(projectId, flagId, ruleId);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="ghost" onClick={onDelete} disabled={pending}>
      {pending ? "…" : "Kaldır"}
    </Button>
  );
}

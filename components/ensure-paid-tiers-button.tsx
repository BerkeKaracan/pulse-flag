"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/components/locale-provider";

type Props = {
  projectId: string;
  flagId: string;
};

export function EnsurePaidTiersButton({ projectId, flagId }: Props) {
  const router = useRouter();
  const { dict } = useDictionary();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    setOkMsg(null);
    try {
      const res = await adminApi.ensurePaidTiers(projectId, flagId);
      if (res.created_rule) {
        setOkMsg(dict.flagDetail.ensureCreated);
      } else if (res.updated_rule) {
        setOkMsg(dict.flagDetail.ensureUpdated);
      } else {
        setOkMsg(dict.flagDetail.ensureAlready);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.flagDetail.ensureError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2 rounded-2xl border border-teal-900/15 bg-teal-50/70 p-4">
      <p className="text-sm font-semibold text-teal-950">
        {dict.flagDetail.ensureTitle}
      </p>
      <p className="text-xs text-teal-900/80">{dict.flagDetail.ensureHint}</p>
      <Button type="button" onClick={onClick} loading={pending}>
        {pending ? dict.common.saving : dict.flagDetail.ensureSubmit}
      </Button>
      {okMsg ? <p className="text-sm text-teal-800">{okMsg}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

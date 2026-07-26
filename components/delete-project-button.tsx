"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/components/locale-provider";

type Props = {
  projectId: string;
  projectName: string;
  /** When true, navigate to /projects after delete (detail page). */
  redirectAfter?: boolean;
};

export function DeleteProjectButton({
  projectId,
  projectName,
  redirectAfter = false,
}: Props) {
  const router = useRouter();
  const { dict } = useDictionary();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    const ok = window.confirm(
      dict.projects.deleteConfirm.replace("{name}", projectName),
    );
    if (!ok) return;

    setPending(true);
    setError(null);
    try {
      await adminApi.deleteProject(projectId);
      if (redirectAfter) {
        router.push("/projects");
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.projects.deleteError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        onClick={onDelete}
        loading={pending}
        className="text-red-700 hover:bg-red-50 hover:text-red-900"
      >
        {pending ? dict.common.saving : dict.projects.delete}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/components/locale-provider";

type Props = {
  value: string;
  label?: string;
};

export function CopyButton({ value, label }: Props) {
  const { dict } = useDictionary();
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button type="button" variant="secondary" onClick={onCopy}>
      {copied ? dict.common.copied : label ?? dict.common.copy}
    </Button>
  );
}

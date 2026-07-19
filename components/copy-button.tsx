"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  label?: string;
};

export function CopyButton({ value, label = "Kopyala" }: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button type="button" variant="secondary" onClick={onCopy}>
      {copied ? "Kopyalandı" : label}
    </Button>
  );
}

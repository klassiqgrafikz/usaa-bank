"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyValue({
  value,
  className,
  ariaLabel,
  tone = "light",
}: {
  value: string;
  className?: string;
  ariaLabel?: string;
  tone?: "light" | "dark";
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement("textarea");
        el.value = value;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
    } catch {
      // Still surface feedback.
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors",
        tone === "dark" ? "hover:bg-white/10" : "hover:bg-slate-100",
        className,
      )}
    >
      <span className="font-mono">{value}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : ariaLabel ?? `Copy ${value}`}
        className={cn(
          "shrink-0 transition-colors",
          copied
            ? tone === "dark"
              ? "text-emerald-300"
              : "text-emerald-600"
            : tone === "dark"
              ? "text-slate-400 hover:text-white"
              : "text-slate-400 hover:text-usaa-700",
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}
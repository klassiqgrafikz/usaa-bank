"use client";

import { useEffect, useState } from "react";

export function ResendButton({
  onResend,
  cooldown = 30,
  label = "Didn't get it? Resend",
  sendingLabel = "Sending…",
  successMessage = "A new email is on its way.",
  className = "link text-sm",
}: {
  onResend: () => Promise<string | null>;
  cooldown?: number;
  label?: string;
  sendingLabel?: string;
  successMessage?: string;
  className?: string;
}) {
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = setTimeout(() => setCooldownLeft((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownLeft]);

  async function handleClick() {
    if (sending || cooldownLeft > 0) return;
    setSending(true);
    setMessage(null);
    const error = await onResend();
    setSending(false);
    if (error) {
      setMessage({ text: error, ok: false });
      return;
    }
    setMessage({ text: successMessage, ok: true });
    setCooldownLeft(cooldown);
  }

  return (
    <div className="space-y-2 text-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={sending || cooldownLeft > 0}
        className={className}
      >
        {cooldownLeft > 0
          ? `${label} (${cooldownLeft}s)`
          : sending
            ? sendingLabel
            : label}
      </button>
      {message && (
        <p
          className={message.ok ? "text-xs text-emerald-600" : "text-xs text-red-600"}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ResendButton } from "@/components/auth/resend-button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendRecovery(): Promise<string | null> {
    const res = await fetch("/api/auth/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "recovery", email: email.trim() }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    return data.ok ? null : data.error ?? "We couldn't send that email. Try again.";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const err = await sendRecovery();
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setNotice(
      "If that email is registered, we've sent you a link to choose a new password. Check your inbox, including spam.",
    );
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-usaa-900">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter the email on your account and we&apos;ll send you a secure link to
        choose a new password.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "One moment…" : "Continue"}
        </button>
      </form>

      {notice && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <ResendButton
            label="Resend email"
            successMessage="Reset email re-sent."
            onResend={sendRecovery}
          />
        </div>
      )}

      <div className="mt-6 text-center text-sm text-slate-600">
        Remembered it?{" "}
        <Link href="/login" className="link">
          Back to sign on
        </Link>
      </div>
    </>
  );
}

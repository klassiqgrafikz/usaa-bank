"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ResendButton } from "@/components/auth/resend-button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode(): Promise<string | null> {
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), purpose: "reset" }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    return data.ok ? null : data.error ?? "We couldn't send that code. Try again.";
  }

  async function onSendEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const err = await sendCode();
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setSent(true);
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword: password }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    setLoading(false);

    if (!data.ok) {
      setError(data.error ?? "We couldn't reset your password. Try again.");
      return;
    }

    setDone(true);
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-usaa-900">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-500">
        {done
          ? "Your password has been reset."
          : sent
            ? "We emailed a 6-digit code. Enter it with your new password."
            : "Enter the email on your account and we&apos;ll email you a 6-digit code."}
      </p>

      {done ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Your password has been reset. Sign on with your new password.
          </div>
          <Link href="/login" className="btn-primary block w-full text-center">
            Back to sign on
          </Link>
        </div>
      ) : sent ? (
        <form onSubmit={onReset} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="code">
              Verification code
            </label>
            <input
              id="code"
              inputMode="numeric"
              className="input text-center font-mono text-lg tracking-[0.5em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="confirm">
              Confirm new password
            </label>
            <input
              id="confirm"
              type="password"
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Resetting…" : "Reset password"}
          </button>

          <div className="border-t border-slate-100 pt-4">
            <ResendButton
              label="Didn't get a code? Resend it"
              successMessage="A new code is on its way. Check your inbox, including spam."
              onResend={sendCode}
            />
          </div>
        </form>
      ) : (
        <form onSubmit={onSendEmail} className="mt-6 space-y-4">
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

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "One moment…" : "Send code"}
          </button>
        </form>
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

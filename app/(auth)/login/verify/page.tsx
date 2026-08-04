"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ResendButton } from "@/components/auth/resend-button";

function getStoredEmail(): string | undefined {
  const raw = sessionStorage.getItem("usaa_2fa");
  if (!raw) return undefined;
  try {
    return (JSON.parse(raw) as { email?: string }).email;
  } catch {
    return undefined;
  }
}

export default function VerifyPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const email = getStoredEmail();
    if (!email) {
      router.replace("/login");
      return;
    }

    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) {
          router.replace("/login");
          return;
        }
        setChecked(true);
      });
    });
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const email = getStoredEmail();
    if (!email) {
      setError("Your sign-on session expired. Please sign on again.");
      setLoading(false);
      router.replace("/login");
      return;
    }

    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: code.trim() }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };

    if (!data.ok) {
      setError(data.error ?? "That code didn't match. Please try again.");
      setLoading(false);
      return;
    }

    sessionStorage.removeItem("usaa_2fa");
    const next = window.location.search
      .replace(/^\?next=/, "")
      .replace(/&next=.*$/, "");
    router.push(next?.startsWith("/bank") ? next : "/bank/dashboard");
    router.refresh();
  }

  if (!checked) {
    return (
      <div className="text-sm text-slate-500">Checking your session…</div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-usaa-900">Two-step verification</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter the 6-digit code we sent by email to confirm it&apos;s really you.
        Be sure to check your spam folder if it doesn&apos;t arrive.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
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

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>

      <div className="mt-6">
        <ResendButton
          onResend={async () => {
            const email = getStoredEmail();
            if (!email) {
              router.replace("/login");
              return "Your sign-on session expired. Please sign on again.";
            }
            const res = await fetch("/api/auth/otp/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });
            const data = (await res.json()) as { ok: boolean; error?: string };
            return data.ok ? null : data.error ?? "We couldn't resend the code. Try again.";
          }}
        />
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="link text-sm"
          onClick={() =>
            import("@/lib/supabase/client").then(({ createClient }) =>
              createClient().auth.signOut(),
            )
          }
        >
          Use a different account
        </Link>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem("usaa_2fa");
    let parsed: { email?: string } | null = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw) as { email?: string };
      } catch {
        /* ignore */
      }
    }
    const email = parsed?.email;

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

  async function resendCode() {
    const raw = sessionStorage.getItem("usaa_2fa");
    let email: string | undefined;
    try {
      email = (JSON.parse(raw ?? "{}") as { email?: string }).email;
    } catch {
      /* ignore */
    }
    if (!email) return;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setError(null);
    setResendCooldown(30);
    const timer = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const raw = sessionStorage.getItem("usaa_2fa");
    let email: string | undefined;
    try {
      email = (JSON.parse(raw ?? "{}") as { email?: string }).email;
    } catch {
      /* ignore */
    }
    if (!email) {
      setError("Your sign-on session expired. Please sign on again.");
      setLoading(false);
      router.replace("/login");
      return;
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    if (verifyError) {
      setError("That code didn't match. Please try again.");
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

        <button
          type="button"
          onClick={resendCode}
          disabled={resendCooldown > 0 || loading}
          className="link w-full text-sm"
        >
          {resendCooldown > 0
            ? `Resend code in ${resendCooldown}s`
            : "Didn't get a code? Resend it"}
        </button>
      </form>

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

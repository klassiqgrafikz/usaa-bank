"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isMockMode } from "@/lib/mock";

export default function VerifyPage() {
  const router = useRouter();
  const mock = isMockMode();

  const [code, setCode] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("usaa_2fa");
    sessionStorage.removeItem("usaa_2fa");
    let parsed: { code?: string } | null = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw) as { code?: string };
      } catch {
        /* ignore */
      }
    }
    const stored = parsed?.code;

    if (mock) {
      if (!stored) {
        router.replace("/login");
        return;
      }
      Promise.resolve().then(() => {
        setHint(stored);
        setChecked(true);
      });
      return;
    }

    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) {
          router.replace("/login");
          return;
        }
        if (stored) setHint(stored);
        setChecked(true);
      });
    });
  }, [router, mock]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mock) {
      if (code.trim() === hint) {
        const next = window.location.search
          .replace(/^\?next=/, "")
          .replace(/&next=.*$/, "");
        router.push(next?.startsWith("/bank") ? next : "/bank/dashboard");
        router.refresh();
        return;
      }
      setError("That code didn't match. Please try again.");
      setLoading(false);
      return;
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: valid } = await supabase.rpc("verify_demo_code", {
      p_code: code.trim(),
      p_purpose: "2fa",
    });

    if (!valid) {
      setError("That code didn't match. Please try again.");
      setLoading(false);
      return;
    }

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
        Enter the 6-digit code we sent to confirm it&apos;s really you.
      </p>

      {hint && (
        <div className="mt-4 rounded-md border border-gold-400/60 bg-gold-400/15 px-3 py-2 text-sm">
          <span className="font-semibold text-usaa-800">Demo delivery:</span>{" "}
          no email/SMS provider is attached, so your code is{" "}
          <span className="font-mono font-bold text-usaa-900">{hint}</span>.
        </div>
      )}

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

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="link text-sm"
          onClick={() =>
            isMockMode()
              ? router.push("/login")
              : import("@/lib/supabase/client").then(({ createClient }) =>
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
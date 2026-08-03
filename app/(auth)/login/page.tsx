"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { isMockMode } from "@/lib/mock";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const mock = isMockMode();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mock) {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const email = username.includes("@") ? username : `${username}@usaa-demo.com`;
        sessionStorage.setItem("usaa_2fa", JSON.stringify({ code, email }));
        router.push("/login/verify");
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: username.includes("@") ? username : `${username}@usaa-demo.com`,
        password,
      });
      if (signInError || !data.user) {
        setError(signInError?.message ?? "Unable to sign you on.");
        return;
      }

      const { data: code, error: codeError } = await supabase.rpc("create_demo_code", {
        p_purpose: "2fa",
      });
      if (codeError) {
        setError(codeError.message);
        return;
      }

      sessionStorage.setItem("usaa_2fa", JSON.stringify({ code, email: data.user.email }));
      router.push("/login/verify");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold text-usaa-900">Sign on to online banking</h1>
      <p className="mt-1 text-sm text-slate-500">
        Welcome back. Let&apos;s verify it&apos;s you.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username or email"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-crimson-600"
            />
            Remember this device
          </label>
          <Link href="/forgot-password" className="link">
            Forgot username or password?
          </Link>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing on…" : "Sign On"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
        New to the demo?{" "}
<Link href="/signup" className="link">
Create an account
          </Link>
        </div>

      {params.get("next") && (
        <div className="mt-4 rounded-md bg-usaa-50 px-3 py-2 text-xs text-usaa-700">
          You&apos;ll be returned to the page you were viewing after signing on.
        </div>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
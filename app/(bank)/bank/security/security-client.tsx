"use client";

import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Monitor, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";

export function SecurityClient() {
  const [email, setEmail] = useState("");

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => {
        if (data.user?.email) setEmail(data.user.email);
      });
    });
  }, []);

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    setLoading(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (signInError) {
      setError("Current password is incorrect.");
      setLoading(false);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess("Password updated successfully.");
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  const device = {
    name: "This browser",
    location: "Current session",
    last: "Just now",
  };

  return (
    <>
      <PageHeader title="Security" subtitle="Protect your account and manage how you sign on." />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={changePassword} className="card p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-usaa-700" />
            <h2 className="font-bold text-usaa-900">Change password</h2>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <label className="label">Current password</label>
              <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            {success && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-usaa-700" />
              <h2 className="font-bold text-usaa-900">Two-step verification</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Always on. Every sign-on is confirmed with a 6-digit code sent to
              the email on your account.
            </p>
            <span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Enabled
            </span>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-usaa-700" />
              <h2 className="font-bold text-usaa-900">Current session</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{device.name}</p>
                  <p className="text-xs text-slate-400">
                    {device.location} · {device.last}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
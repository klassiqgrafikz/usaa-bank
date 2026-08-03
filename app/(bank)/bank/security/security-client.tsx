"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Monitor, RefreshCw, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { getBankApi } from "@/lib/bank";
import { isMockMode } from "@/lib/mock";

export function SecurityClient({ email }: { email: string }) {

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    setLoading(true);
    if (isMockMode()) {
      setSuccess("Password updated successfully.");
      setLoading(false);
      setCurrent("");
      setNext("");
      setConfirm("");
      return;
    }
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

  async function resetData() {
    if (!window.confirm("Reset all demo data to the sample starting point?")) return;
    setResetting(true);
    const api = await getBankApi();
    await api.resetDemo();
    setResetting(false);
    window.location.reload();
  }

  const devices = [
    { name: "Windows Desktop · Chrome", location: "San Antonio, TX", active: true, last: "Just now" },
    { name: "iPhone 15 · Safari", location: "San Antonio, TX", active: true, last: "Yesterday" },
  ];

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
              Always on. Every sign-on is confirmed with a 6-digit code, delivered
              inline in this demo since no email/SMS provider is attached.
            </p>
            <span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Enabled
            </span>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-usaa-700" />
              <h2 className="font-bold text-usaa-900">Trusted devices</h2>
            </div>
            <div className="mt-4 space-y-3">
              {devices.map((d) => (
                <div key={d.name} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{d.name}</p>
                    <p className="text-xs text-slate-400">
                      {d.location} · {d.last}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Trusted
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-usaa-700" />
              <h2 className="font-bold text-usaa-900">Reset demo data</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Wipe everything and regenerate the sample accounts, transactions,
              payees and contacts.
            </p>
            <button onClick={resetData} disabled={resetting} className="btn-secondary mt-4 w-full">
              {resetting ? "Resetting…" : "Reset all demo data"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
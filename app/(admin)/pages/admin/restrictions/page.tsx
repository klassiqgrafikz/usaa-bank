"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ShieldAlert } from "lucide-react";
import { getAdminApi } from "@/lib/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Account } from "@/lib/types";

export default function AdminRestrictionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [accountNumber, setAccountNumber] = useState("");
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const api = await getAdminApi();
    const list = await api.listRestrictions();
    setAccounts(list);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    getAdminApi().then((api) =>
      api.listRestrictions().then((list) => {
        if (active) {
          setAccounts(list);
          setLoading(false);
        }
      }),
    );
    return () => {
      active = false;
    };
  }, []);

  async function restrict(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!accountNumber.trim() || !reason.trim()) {
      setError("Account number and reason are required.");
      return;
    }
    setBusy(true);
    const api = await getAdminApi();
    const res = await api.restrictAccount({
      accountNumber: accountNumber.trim(),
      reason: reason.trim(),
      until: until || null,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setAccountNumber("");
    setReason("");
    setUntil("");
    setMessage("Account restricted.");
    load();
  }

  async function unrestrict(accountNumber: string) {
    const api = await getAdminApi();
    const res = await api.unrestrictAccount(accountNumber);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setMessage("Account restriction lifted.");
    load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-usaa-900">Account restrictions</h1>
      <p className="mt-1 text-sm text-slate-500">
        Restrict an account by number. Restricted accounts can&apos;t send
        money, transfers, bill payments or Zelle.
      </p>

      <form onSubmit={restrict} className="card mt-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Account number</label>
            <input
              className="input"
              placeholder="1234567890"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Reason</label>
            <input
              className="input"
              placeholder="Suspected fraud"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Restricted until</label>
            <input
              className="input"
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary mt-5">
          {busy ? "Restricting…" : "Restrict account"}
        </button>
      </form>

      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-usaa-900">Currently restricted</h2>
        </div>
        {loading ? (
          <p className="px-6 py-8 text-sm text-slate-400">Loading…</p>
        ) : accounts.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400">
            No restricted accounts.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {accounts.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    {a.name} · {a.account_number}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {a.restriction_reason}
                    {a.restriction_until && (
                      <>
                        {" "}
                        · until {formatDate(a.restriction_until)}
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Balance {formatCurrency(a.balance_cents)}
                  </p>
                </div>
                <button
                  onClick={() => unrestrict(a.account_number)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Lift restriction
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

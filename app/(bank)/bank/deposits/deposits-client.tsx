"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/banking/page-header";
import { CopyValue } from "@/components/banking/copy-value";
import { getBankApi } from "@/lib/bank";
import type { Account } from "@/lib/types";

export function DepositsClient({
  accounts,
  onChanged,
}: {
  accounts: Account[];
  onChanged?: () => void;
}) {
  const searchParams = useSearchParams();
  const depositTargets = accounts.filter(
    (a) => a.type === "checking" || a.type === "savings",
  );

  const initial =
    depositTargets.find((a) => a.id === searchParams?.get("account"))?.id ??
    depositTargets[0]?.id ??
    "";

  const [targetId, setTargetId] = useState(initial);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) {
      setError("Enter a valid deposit amount.");
      return;
    }
    if (!targetId) {
      setError("Choose an account to deposit into.");
      return;
    }
    setSubmitting(true);
    const api = await getBankApi();
    const { error: insertError } = await api.addDeposit({
      accountId: targetId,
      amountCents: cents,
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDone(cents);
    setAmount("");
    onChanged?.();
  }

  const checking = depositTargets.find((a) => a.type === "checking") ?? depositTargets[0];

  return (
    <>
      <PageHeader title="Deposits" subtitle="Add money to your accounts." />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="card p-6">
          <h2 className="text-lg font-bold text-usaa-900">Deposit money</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add funds to one of your deposit accounts.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Deposit to</label>
              <select
                className="input"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                {depositTargets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  $
                </span>
                <input
                  className="input pl-7"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {done !== null && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Your deposit is on its way. It&apos;s showing as pending.
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary mt-5 w-full">
            {submitting ? "Processing…" : "Deposit"}
          </button>
        </form>

        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-usaa-900">Direct deposit</h2>
            <p className="mt-1 text-sm text-slate-500">
              Share these details with your employer to receive paychecks faster.
            </p>
            {checking && (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Deposit account</dt>
                  <dd className="text-right">
                    <CopyValue value={checking.account_number} ariaLabel="Copy account number" />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Routing number</dt>
                  <dd className="text-right">
                    <CopyValue value={checking.routing_number} ariaLabel="Copy routing number" />
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Account type</dt>
                  <dd className="font-medium text-slate-800">Checking</dd>
                </div>
              </dl>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-usaa-900">How it works</h2>
            <p className="mt-1 text-sm text-slate-500">
              Deposits show as pending in your recent activity and post once
              they clear.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

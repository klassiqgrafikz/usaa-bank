"use client";

import { useState, type FormEvent } from "react";
import { Camera, CheckCircle2, MapPin } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { getBankApi } from "@/lib/bank";
import type { Account } from "@/lib/types";

export function DepositsClient({
  accounts,
  onChanged,
}: {
  accounts: Account[];
  onChanged?: () => void;
}) {
  const depositTargets = accounts.filter((a) => a.type === "checking" || a.type === "savings");

  const [targetId, setTargetId] = useState(depositTargets[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [front, setFront] = useState(false);
  const [back, setBack] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) {
      setError("Enter a valid check amount.");
      return;
    }
    if (!front || !back) {
      setError("Add the front and back of the check.");
      return;
    }
    setSubmitting(true);
    const api = await getBankApi();
    const { error: insertError } = await api.makeDeposit({
      accountId: targetId,
      amountCents: cents,
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDone(true);
    onChanged?.();
  }

  const checking = depositTargets[0];

  return (
    <>
      <PageHeader title="Deposits" subtitle="Deposit a check or set up direct deposit." />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="card p-6">
          <h2 className="text-lg font-bold text-usaa-900">Mobile check deposit</h2>
          <p className="mt-1 text-sm text-slate-500">
            Snap the front and back of a signed check, then submit.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Deposit to</label>
              <select className="input" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input className="input pl-7" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFront(true)}
              className={
                front
                  ? "flex items-center justify-center gap-2 rounded-lg border-2 border-emerald-500 bg-emerald-50 p-6 text-sm font-semibold text-emerald-700"
                  : "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-6 text-sm font-medium text-slate-500 hover:border-usaa-400"
              }
            >
              {front ? <CheckCircle2 className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              {front ? "Front added" : "Add front of check"}
            </button>
            <button
              type="button"
              onClick={() => setBack(true)}
              className={
                back
                  ? "flex items-center justify-center gap-2 rounded-lg border-2 border-emerald-500 bg-emerald-50 p-6 text-sm font-semibold text-emerald-700"
                  : "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-6 text-sm font-medium text-slate-500 hover:border-usaa-400"
              }
            >
              {back ? <CheckCircle2 className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              {back ? "Back added" : "Add back of check"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {done && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Check submitted! It&apos;s showing as pending.
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary mt-5 w-full">
            {submitting ? "Submitting…" : "Submit deposit"}
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
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Deposit account</dt>
                  <dd className="font-mono">{checking.account_number}</dd>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Routing number</dt>
                  <dd className="font-mono">{checking.routing_number}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Account type</dt>
                  <dd className="font-medium text-slate-800">Checking</dd>
                </div>
              </dl>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-usaa-900">Deposit funds into your account</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add cash or checks at a fee-free ATM.
            </p>
            <button className="btn-secondary mt-4 w-full">
              <MapPin className="h-4 w-4" /> Find a fee-free ATM
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
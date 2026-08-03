"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getBankApi } from "@/lib/bank";
import type { Account, BillPayment, Payee } from "@/lib/types";

export function BillPayClient({
  payees,
  payments,
  accounts,
  onChanged,
}: {
  payees: Payee[];
  payments: BillPayment[];
  accounts: Account[];
  onChanged?: () => void;
}) {
  const spendable = accounts.filter((a) => a.type === "checking" || a.type === "savings");

  // schedule payment form
  const [payeeId, setPayeeId] = useState(payees[0]?.id ?? "");
  const [fromId, setFromId] = useState(spendable[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [schedule, setSchedule] = useState<"one_time" | "recurring">("one_time");
  const [frequency, setFrequency] = useState("monthly");

  // add payee form
  const [showAdd, setShowAdd] = useState(false);
  const [pName, setName] = useState("");
  const [pCategory, setCategory] = useState("Utilities");
  const [pPhone, setPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const paymentPayee = new Map(payees.map((p) => [p.id, p.name]));

  async function submitPayment(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setLoading(true);
    try {
      const api = await getBankApi();
      const { error: rpcError } = await api.createBillPayment({
        payeeId,
        fromId,
        amountCents: cents,
        schedule,
        frequency: schedule === "recurring" ? frequency : null,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setSuccess(schedule === "recurring" ? "Recurring payment scheduled." : "Payment sent.");
      setAmount("");
      onChanged?.();
    } finally {
      setLoading(false);
    }
  }

  async function addPayee(e: FormEvent) {
    e.preventDefault();
    if (!pName.trim()) return;
    const api = await getBankApi();
    const { error } = await api.addPayee({
      name: pName.trim(),
      category: pCategory,
      phone: pPhone || null,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setShowAdd(false);
    setName("");
    setPhone("");
    onChanged?.();
  }

  return (
    <>
      <PageHeader
        title="Bill pay"
        subtitle="Pay bills on time, on autopilot."
        actions={
          <button className="btn-secondary" onClick={() => setShowAdd((v) => !v)}>
            <Plus className="h-4 w-4" /> Add payee
          </button>
        }
      />

      {showAdd && (
        <form onSubmit={addPayee} className="card mb-6 p-6">
          <h2 className="font-bold text-usaa-900">Add a payee</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={pName} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={pCategory} onChange={(e) => setCategory(e.target.value as "Utilities")}>
                {["Utilities", "Telephone", "Insurance", "Housing", "Credit card", "Loan", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input className="input" value={pPhone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <button className="btn-primary mt-4">Save payee</button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submitPayment} className="card p-6">
          <h2 className="text-lg font-bold text-usaa-900">Schedule a payment</h2>
          <div className="mt-5 space-y-4">
            <div>
              <label className="label">Payee</label>
              <select className="input" value={payeeId} onChange={(e) => setPayeeId(e.target.value)} disabled={payees.length === 0}>
                {payees.length === 0 && <option>Add a payee first</option>}
                {payees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">From account</label>
              <select className="input" value={fromId} onChange={(e) => setFromId(e.target.value)}>
                {spendable.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {formatCurrency(a.available_cents)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Schedule</label>
                <select className="input" value={schedule} onChange={(e) => setSchedule(e.target.value as "one_time" | "recurring")}>
                  <option value="one_time">One time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>
              {schedule === "recurring" && (
                <div>
                  <label className="label">Frequency</label>
                  <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Bi-weekly</option>
                  </select>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            {success && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
            )}

            <button type="submit" disabled={loading || payees.length === 0} className="btn-primary w-full">
              {loading ? "Scheduling…" : "Schedule payment"}
            </button>
          </div>
        </form>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-bold text-usaa-900">Payment history</h2>
          </div>
          <div className="p-6">
            {payments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No payments yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {paymentPayee.get(p.payee_id) ?? "Payee"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(p.created_at)}
                        {p.schedule === "recurring" && ` · ${p.frequency} recurring`}
                        {p.status !== "completed" && ` · ${p.status}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">-{formatCurrency(p.amount_cents)}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          p.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : p.status === "scheduled"
                              ? "bg-usaa-50 text-usaa-700"
                              : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
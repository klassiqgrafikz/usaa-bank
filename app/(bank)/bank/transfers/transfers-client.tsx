"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/banking/page-header";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getBankApi } from "@/lib/bank";
import type { Account, Transfer } from "@/lib/types";

type Dest = "internal" | "external" | "wire";

export function TransfersClient({
  accounts,
  transfers,
  onChanged,
}: {
  accounts: Account[];
  transfers: Transfer[];
  onChanged?: () => void;
}) {

  const spendable = accounts.filter((a) => a.type === "checking" || a.type === "savings");
  const internalTargets = accounts.filter((a) => a.type !== "loan");

  const [dest, setDest] = useState<Dest>("internal");
  const [fromId, setFromId] = useState(spendable[0]?.id ?? "");
  const [toInternalId, setToInternalId] = useState(
    internalTargets[1]?.id ?? internalTargets[0]?.id ?? "",
  );
  const [externalName, setExternalName] = useState("");
  const [externalAcct, setExternalAcct] = useState("");
  const [amount, setAmount] = useState("");
  const [schedule, setSchedule] = useState<"one_time" | "recurring">("one_time");
  const [frequency, setFrequency] = useState("monthly");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
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
      let rpcError: { message: string } | null = null;

      if (dest === "internal") {
        const res = await api.createTransfer({
          internal: true,
          fromId,
          toId: toInternalId,
          amountCents: cents,
          schedule,
          frequency: schedule === "recurring" ? frequency : null,
          note: note || null,
        });
        rpcError = res.error;
      } else {
        const res = await api.createTransfer({
          internal: false,
          fromId,
          externalName:
            externalName +
            (dest === "wire" && externalAcct ? ` (ACCT •${externalAcct.slice(-4)})` : ""),
          amountCents: cents,
          schedule,
          frequency: schedule === "recurring" ? frequency : null,
          note: note || null,
          isWire: dest === "wire",
        });
        rpcError = res.error;
      }

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      setSuccess(
        schedule === "recurring"
          ? "Recurring transfer scheduled."
          : "Transfer completed successfully.",
      );
      setAmount("");
      onChanged?.();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Transfers"
        subtitle="Move money between your accounts or send it out."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="card p-6">
          <h2 className="text-lg font-bold text-usaa-900">New transfer</h2>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {(
              [
                ["internal", "My accounts"],
                ["external", "External"],
                ["wire", "Wire"],
              ] as [Dest, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setDest(k)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                  dest === k
                    ? "border-usaa-700 bg-usaa-700 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="label">From account</label>
              <select className="input" value={fromId} onChange={(e) => setFromId(e.target.value)}>
                {spendable.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {formatCurrency(a.available_cents)} available
                  </option>
                ))}
              </select>
            </div>

            {dest === "internal" ? (
              <div>
                <label className="label">To account</label>
                <select
                  className="input"
                  value={toInternalId}
                  onChange={(e) => setToInternalId(e.target.value)}
                >
                  {internalTargets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">
                    {dest === "wire" ? "Recipient name" : "External bank / account name"}
                  </label>
                  <input
                    className="input"
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Account number</label>
                  <input
                    className="input"
                    value={externalAcct}
                    onChange={(e) => setExternalAcct(e.target.value.replace(/\s/g, ""))}
                    placeholder="Last 4 shown on records"
                  />
                </div>
              </div>
            )}

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
                <select
                  className="input"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value as "one_time" | "recurring")}
                >
                  <option value="one_time">One time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>
              {schedule === "recurring" && (
                <div>
                  <label className="label">Frequency</label>
                  <select
                    className="input"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="label">Note (optional)</label>
              <input
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Rent"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Processing…" : dest === "wire" ? "Send wire" : "Continue"}
            </button>
          </div>
        </form>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-bold text-usaa-900">Transfer history</h2>
          </div>
          <div className="p-6">
            {transfers.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No transfers yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {transfers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {t.transfer_type === "internal"
                          ? "Internal transfer"
                          : t.transfer_type === "wire"
                            ? "Wire to " + (t.external_name ?? "External")
                            : "Transfer to " + (t.external_name ?? "External")}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(t.created_at)}
                        {t.schedule === "recurring" && ` · ${t.frequency} recurring`}
                        {t.status !== "completed" && ` · ${t.status}`}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      -{formatCurrency(Math.abs(t.amount_cents))}
                    </p>
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
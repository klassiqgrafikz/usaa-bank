"use client";

import { useState, type FormEvent } from "react";
import { CreditCard, Lock, LockOpen, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { cn } from "@/lib/utils";
import { getBankApi } from "@/lib/bank";
import type { Card, Dispute } from "@/lib/types";

export function CardsClient({
  cards,
  disputes,
  onChanged,
}: {
  cards: Card[];
  disputes: Dispute[];
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [showDispute, setShowDispute] = useState(false);
  const [ref, setRef] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("I didn't make this purchase");

  async function toggleLock(card: Card) {
    setBusy(card.id);
    const api = await getBankApi();
    await api.setCardStatus(card.id, card.status === "locked" ? "active" : "locked");
    setBusy(null);
    onChanged?.();
  }

  async function report(card: Card, status: "lost" | "stolen") {
    if (
      !window.confirm(
        `Report this ${card.brand} card as ${status}? It will be frozen and you'll be able to request a replacement.`,
      )
    )
      return;
    const api = await getBankApi();
    await api.setCardStatus(card.id, status);
    onChanged?.();
  }

  async function fileDispute(e: FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (!ref.trim() || !cents) return;
    const api = await getBankApi();
    await api.fileDispute({ ref: ref.trim(), amountCents: cents, reason });
    setShowDispute(false);
    setRef("");
    setAmount("");
    onChanged?.();
  }

  return (
    <>
      <PageHeader
        title="Cards"
        subtitle="Manage the cards on your accounts."
        actions={
          <button className="btn-secondary" onClick={() => setShowDispute((v) => !v)}>
            <ShieldAlert className="h-4 w-4" /> Dispute a charge
          </button>
        }
      />

      {showDispute && (
        <form onSubmit={fileDispute} className="card mb-6 p-6">
          <h2 className="font-bold text-usaa-900">File a dispute</h2>
          <p className="mt-1 text-sm text-slate-500">
            Provide the transaction reference from your account activity.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Transaction reference</label>
              <input className="input" value={ref} onChange={(e) => setRef(e.target.value)} required />
            </div>
            <div>
              <label className="label">Amount</label>
              <input className="input" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="label">Reason</label>
              <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
                <option>Unauthorized transaction</option>
                <option>I didn&apos;t receive the item</option>
                <option>Charged more than expected</option>
                <option>Duplicate charge</option>
              </select>
            </div>
          </div>
          <button className="btn-primary mt-4">Submit dispute</button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {cards.map((card) => (
            <div key={card.id} className="card overflow-hidden">
              <div className="bg-gradient-to-br from-usaa-800 to-usaa-950 p-6 text-white">
                <div className="flex items-center justify-between">
                  <CreditCard className="h-6 w-6" />
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase">
                    {card.brand} {card.card_type}
                  </span>
                </div>
                <p className="mt-8 font-mono text-lg tracking-widest text-slate-200">
                  •••• •••• •••• {card.card_last4}
                </p>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
                  <span>Member</span>
                  <span>Exp {card.expires}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 p-4">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                    card.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : card.status === "locked"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-crimson-50 text-crimson-700",
                  )}
                >
                  {card.status}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => toggleLock(card)} disabled={busy === card.id} className="btn-secondary px-3 py-1.5 text-xs">
                    {card.status === "locked" ? (
                      <>
                        <LockOpen className="h-3.5 w-3.5" /> Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" /> Lock
                      </>
                    )}
                  </button>
                  {card.status === "active" && (
                    <>
                      <button onClick={() => report(card, "lost")} className="btn-secondary px-3 py-1.5 text-xs">
                        Lost
                      </button>
                      <button onClick={() => report(card, "stolen")} className="btn-secondary px-3 py-1.5 text-xs">
                        Stolen
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-usaa-900">Rewards summary</h2>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-sm text-slate-500">Points earned</p>
                <p className="text-3xl font-extrabold text-usaa-900">12,480</p>
              </div>
              <span className="rounded-full bg-gold-400/20 px-3 py-1 text-sm font-semibold text-amber-700">
                ≈ $124.80
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Points never expire on the Rewards Visa in this demo.
            </p>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-bold text-usaa-900">Disputes</h2>
            </div>
            <div className="p-6">
              {disputes.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No disputes on file.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {disputes.map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{d.reason}</p>
                        <p className="text-xs text-slate-400">Ref {d.transaction_ref}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-usaa-900">${(d.amount_cents / 100).toFixed(2)}</p>
                        <span className="text-xs capitalize text-slate-400">{d.status.replace("_", " ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
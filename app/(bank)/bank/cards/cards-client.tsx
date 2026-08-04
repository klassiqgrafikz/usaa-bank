"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Snowflake,
  Sun,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { CardFace, NetworkLogo } from "@/components/banking/card-face";
import { cn } from "@/lib/utils";
import { getBankApi } from "@/lib/bank";
import type { Account, Card, Dispute, Transaction } from "@/lib/types";

export function CardsClient({
  cards,
  disputes,
  transactions,
  accounts,
  onChanged,
}: {
  cards: Card[];
  disputes: Dispute[];
  transactions: Transaction[];
  accounts: Account[];
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [issueAccount, setIssueAccount] = useState(accounts[0]?.id ?? "");
  const [issueNetwork, setIssueNetwork] = useState<"Visa" | "Mastercard">("Visa");
  const [issuing, setIssuing] = useState(false);

  const [showDispute, setShowDispute] = useState(false);
  const [ref, setRef] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("I didn't make this purchase");

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  function toggleReveal(id: string) {
    setRevealed((r) => ({ ...r, [id]: !r[id] }));
  }

  async function copyDetails(card: Card) {
    if (!revealed[card.id]) return;
    const lines = [
      `${card.brand} ${card.card_type} card`,
      `Number: ${card.card_number ?? card.card_last4}`,
      `Expires: ${card.expires}`,
      `CVV: ${card.cvv ?? "•••"}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {
      const el = document.createElement("textarea");
      el.value = lines.join("\n");
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    showToast("Card details copied!");
  }

  async function toggleFreeze(card: Card) {
    setBusy(card.id);
    const api = await getBankApi();
    const { error } = await api.setCardStatus(
      card.id,
      card.status === "frozen" ? "active" : "frozen",
    );
    setBusy(null);
    if (error) {
      showToast(error.message);
      return;
    }
    onChanged?.();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const api = await getBankApi();
    const { error } = await api.deleteCard(deleteTarget.id);
    setDeleting(false);
    if (error) {
      showToast(error.message);
      setDeleteTarget(null);
      return;
    }
    setDeleteTarget(null);
    showToast("Card deleted.");
    onChanged?.();
  }

  async function issueCard(e: FormEvent) {
    e.preventDefault();
    if (!issueAccount) return;
    setIssuing(true);
    const api = await getBankApi();
    const { error } = await api.issueVirtualCard({
      accountId: issueAccount,
      network: issueNetwork,
    });
    setIssuing(false);
    if (error) {
      showToast(error.message);
      return;
    }
    showToast("Virtual card issued!");
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
        subtitle="Manage and secure your cards."
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
          {/* Issue a new virtual card */}
          <form onSubmit={issueCard} className="card p-5">
            <h2 className="font-bold text-usaa-900">Issue a new virtual card</h2>
            <p className="mt-1 text-sm text-slate-500">
              A secure virtual card with a Luhn-valid number, linked to one of
              your accounts.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Link to account</label>
                <select
                  className="input"
                  value={issueAccount}
                  onChange={(e) => setIssueAccount(e.target.value)}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {a.type.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Card network</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIssueNetwork("Visa")}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-md border text-sm font-semibold transition-colors",
                      issueNetwork === "Visa"
                        ? "border-usaa-700 bg-usaa-700 text-white"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    VISA
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueNetwork("Mastercard")}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-md border transition-colors",
                      issueNetwork === "Mastercard"
                        ? "border-usaa-700 bg-usaa-700"
                        : "border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <NetworkLogo brand="Mastercard" />
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={issuing || !issueAccount} className="btn-primary mt-4">
              {issuing ? "Issuing…" : "Issue virtual card"}
            </button>
          </form>

          {/* Cards */}
          {cards.length === 0 && (
            <p className="card p-6 text-center text-sm text-slate-400">
              No cards yet. Issue a virtual card above.
            </p>
          )}
          {cards.map((card) => {
            const isRevealed = !!revealed[card.id];
            const frozen = card.status === "frozen";
            return (
              <div key={card.id} className="card p-5">
                <CardFace card={card} revealed={isRevealed} />

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                      frozen
                        ? "bg-slate-100 text-slate-600"
                        : "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    {frozen ? "Frozen" : "Active"}
                  </span>
                  <span className="rounded-full bg-usaa-50 px-2 py-0.5 text-xs font-semibold capitalize text-usaa-700">
                    {card.brand} · {card.card_type}
                  </span>

                  <div className="ml-auto flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleReveal(card.id)}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      {isRevealed ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Hide details
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Reveal details
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => copyDetails(card)}
                      disabled={!isRevealed}
                      title={isRevealed ? "Copy card details" : "Reveal the card first"}
                      className="btn-secondary px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy details
                    </button>
                    <button
                      onClick={() => toggleFreeze(card)}
                      disabled={busy === card.id}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      {frozen ? (
                        <>
                          <Sun className="h-3.5 w-3.5" /> Unfreeze
                        </>
                      ) : (
                        <>
                          <Snowflake className="h-3.5 w-3.5" /> Freeze
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(card)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-crimson-200 px-3 py-1.5 text-xs font-semibold text-crimson-600 transition-colors hover:bg-crimson-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <RewardsSummary transactions={transactions} accounts={accounts} />

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

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50"
            aria-hidden="true"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-usaa-900">Delete this card?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to permanently delete this card? This
              action can&apos;t be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-md bg-crimson-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-crimson-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting…" : "Delete card"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </>
  );
}

function RewardsSummary({
  transactions,
  accounts,
}: {
  transactions: Transaction[];
  accounts: Account[];
}) {
  const creditAccountIds = new Set(
    accounts.filter((a) => a.type === "credit_card").map((a) => a.id),
  );
  const postedSpend = transactions
    .filter(
      (t) =>
        t.amount_cents < 0 &&
        t.status === "posted" &&
        creditAccountIds.has(t.account_id),
    )
    .reduce((sum, t) => sum + Math.abs(t.amount_cents), 0);
  const points = Math.floor(postedSpend / 100);

  return (
    <div className="card p-6">
      <h2 className="font-bold text-usaa-900">Rewards summary</h2>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-sm text-slate-500">Points earned</p>
          <p className="text-3xl font-extrabold text-usaa-900">
            {points.toLocaleString("en-US")}
          </p>
        </div>
        <span className="rounded-full bg-gold-400/20 px-3 py-1 text-sm font-semibold text-amber-700">
          ≈ ${(points / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Earn 1 point per $1 of posted card purchases. Points never expire.
      </p>
    </div>
  );
}

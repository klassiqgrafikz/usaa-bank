"use client";

import { useState, type FormEvent } from "react";
import { ArrowDownLeft, ArrowUpRight, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getBankApi } from "@/lib/bank";
import type { Account, ZelleContact, ZelleTransfer } from "@/lib/types";

export function PayClient({
  contacts,
  transfers,
  accounts,
  onChanged,
}: {
  contacts: ZelleContact[];
  transfers: ZelleTransfer[];
  accounts: Account[];
  onChanged?: () => void;
}) {
  const checking = accounts.find((a) => a.type === "checking");

  const [contactId, setContactId] = useState(contacts[0]?.id ?? "");
  const [mode, setMode] = useState<"sent" | "request">("sent");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [cName, setCName] = useState("");
  const [cHandle, setCHandle] = useState("");
  const [cBank, setCBank] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const contactMap = new Map(contacts.map((c) => [c.id, c.name]));

  async function send(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) {
      setError("Enter an amount.");
      return;
    }
    if (!checking) {
      setError("No checking account available.");
      return;
    }
    setLoading(true);
    try {
      const api = await getBankApi();
      const { error: rpcError } = await api.createZelleTransfer({
        contactId,
        amountCents: cents,
        direction: mode === "sent" ? "sent" : "request",
        note: note || null,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setSuccess(mode === "sent" ? "Money sent instantly." : "Payment request sent.");
      setAmount("");
      setNote("");
      onChanged?.();
    } finally {
      setLoading(false);
    }
  }

  async function addContact(e: FormEvent) {
    e.preventDefault();
    if (!cName.trim() || !cHandle.trim()) return;
    const api = await getBankApi();
    const { error: insertError } = await api.addZelleContact({
      name: cName.trim(),
      emailOrPhone: cHandle.trim(),
      bank: cBank || null,
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setShowAdd(false);
    setCName("");
    setCHandle("");
    setCBank("");
    onChanged?.();
  }

  return (
    <>
      <PageHeader
        title="Zelle"
        subtitle="Send and receive money fast with people you trust."
        actions={
          <button className="btn-secondary" onClick={() => setShowAdd((v) => !v)}>
            <UserPlus className="h-4 w-4" /> Add contact
          </button>
        }
      />

      {showAdd && (
        <form onSubmit={addContact} className="card mb-6 p-6">
          <h2 className="font-semibold text-usaa-900">Add a Zelle contact</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={cName} onChange={(e) => setCName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Email or phone</label>
              <input className="input" value={cHandle} onChange={(e) => setCHandle(e.target.value)} required />
            </div>
            <div>
              <label className="label">Bank (optional)</label>
              <input className="input" value={cBank} onChange={(e) => setCBank(e.target.value)} />
            </div>
          </div>
          <button className="btn-primary mt-4">Save contact</button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={send} className="card p-6">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            {(
              [
                ["sent", "Send"],
                ["request", "Request"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setMode(k)}
                className={cn(
                  "rounded-md py-2 text-sm font-semibold transition-colors",
                  mode === k ? "bg-white text-usaa-900 shadow-sm" : "text-slate-600",
                )}
              >
                {label} money
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="label">To</label>
              <select className="input" value={contactId} onChange={(e) => setContactId(e.target.value)} disabled={contacts.length === 0}>
                {contacts.length === 0 && <option>Add a contact first</option>}
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.email_or_phone}
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
            <div>
              <label className="label">Note (optional)</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            {success && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
            )}

            <button type="submit" disabled={loading || contacts.length === 0} className="btn-primary w-full">
              {loading ? "Working…" : mode === "sent" ? "Send with Zelle" : "Request with Zelle"}
            </button>
          </div>
        </form>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-bold text-usaa-900">Activity</h2>
          </div>
          <div className="p-6">
            {transfers.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No Zelle activity yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {transfers.map((t) => {
                  const income = t.direction === "received";
                  return (
                    <div key={t.id} className="flex items-center gap-3 py-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full",
                          income ? "bg-emerald-50 text-emerald-600" : "bg-usaa-50 text-usaa-700",
                        )}
                      >
                        {income ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {income ? "Received from " : "Sent to "}
                          {contactMap.get(t.contact_id ?? "") ?? "Contact"}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {formatDate(t.created_at)}
                          {t.note && ` · ${t.note}`}
                        </p>
                      </div>
                      <p className={cn("text-sm font-bold", income ? "text-emerald-600" : "text-slate-800")}>
                        {income ? "+" : "-"}
                        {formatCurrency(Math.abs(t.amount_cents))}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
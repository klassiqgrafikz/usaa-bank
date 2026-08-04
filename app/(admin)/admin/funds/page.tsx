"use client";

import { useState, type FormEvent } from "react";
import { Wallet } from "lucide-react";
import { getAdminApi } from "@/lib/admin";
import { formatCurrency } from "@/lib/utils";

export default function AdminFundsPage() {
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    name: string;
    balance_cents: number;
  } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!accountNumber.trim() || !cents || cents <= 0) {
      setError("Enter a valid account number and amount.");
      return;
    }
    setBusy(true);
    const api = await getAdminApi();
    const res = await api.addFunds({
      accountNumber: accountNumber.trim(),
      amountCents: cents,
      note: note.trim() || null,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setAccountNumber("");
    setAmount("");
    setNote("");
    setResult(res.result);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-usaa-900">Add funds</h1>
      <p className="mt-1 text-sm text-slate-500">
        Credit any account instantly using its account number.
      </p>

      <form onSubmit={submit} className="card mt-6 p-6">
        <label className="label">Account number</label>
        <input
          className="input"
          placeholder="1234567890"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          required
        />

        <label className="label mt-4">Amount (USD)</label>
        <input
          className="input"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="250.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <label className="label mt-4">Note (optional)</label>
        <input
          className="input"
          placeholder="Promotional credit"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-4 flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <Wallet className="h-4 w-4 shrink-0" />
            <span>
              <strong>{result.name}</strong> now has{" "}
              {formatCurrency(result.balance_cents)}.
            </span>
          </div>
        )}

        <button type="submit" disabled={busy} className="btn-primary mt-5">
          {busy ? "Adding…" : "Add funds"}
        </button>
      </form>
    </div>
  );
}

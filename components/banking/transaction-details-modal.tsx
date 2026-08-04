"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { formatCurrency, titleCase } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export function TransactionDetailsModal({
  tx,
  accountName,
  onClose,
}: {
  tx: Transaction;
  accountName?: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const incoming = tx.amount_cents > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-usaa-900">Transaction details</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p
            className={`text-3xl font-extrabold ${
              incoming ? "text-emerald-600" : "text-slate-900"
            }`}
          >
            {incoming ? "+" : "-"}
            {formatCurrency(Math.abs(tx.amount_cents))}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {tx.description}
          </p>
          <span
            className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
              tx.status === "pending"
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {titleCase(tx.status)}
          </span>

          <dl className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Merchant</dt>
              <dd className="text-right font-medium text-slate-800">
                {tx.merchant ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Category</dt>
              <dd className="text-right font-medium text-slate-800">
                {titleCase(tx.category)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Account</dt>
              <dd className="text-right font-medium text-slate-800">
                {accountName ?? "Account"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Date &amp; time</dt>
              <dd className="text-right font-medium text-slate-800">
                {new Date(tx.posted_at).toLocaleString("en-US", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </dd>
            </div>
            {tx.reference && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Reference</dt>
                <dd className="text-right font-mono text-xs text-slate-800">
                  {tx.reference}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

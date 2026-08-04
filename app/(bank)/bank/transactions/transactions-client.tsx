"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { Download, Search } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { TransactionList } from "@/components/banking/transaction-row";
import { formatCurrency } from "@/lib/utils";
import type { Account, Transaction } from "@/lib/types";

const categories = [
  "All",
  "Income",
  "Transfer",
  "Groceries",
  "Dining",
  "Shopping",
  "Travel",
  "Bill Pay",
  "Utilities",
  "Fuel",
  "Entertainment",
  "Health",
  "Loan",
  "Rewards",
  "Zelle",
  "Other",
];

export function TransactionsClient({
  initialTransactions,
  accounts,
}: {
  initialTransactions: Transaction[];
  accounts: Account[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [accountId, setAccountId] = useState("All");
  const [range, setRange] = useState("All");
  const [now] = useState(() => Date.now());

  const accountName = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );

  const filtered = useMemo(() => {
    return initialTransactions.filter((tx) => {
      if (category !== "All" && tx.category !== category) return false;
      if (status !== "All" && tx.status !== status) return false;
      if (accountId !== "All" && tx.account_id !== accountId) return false;
      if (range === "30d" && now - new Date(tx.posted_at).getTime() > 30 * 86400000)
        return false;
      if (range === "90d" && now - new Date(tx.posted_at).getTime() > 90 * 86400000)
        return false;
      if (query) {
        const q = query.toLowerCase();
        if (!tx.description.toLowerCase().includes(q) && !(tx.merchant ?? "").toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [initialTransactions, query, category, status, accountId, range, now]);

  const totalIn = filtered
    .filter((t) => t.amount_cents > 0)
    .reduce((s, t) => s + t.amount_cents, 0);
  const totalOut = filtered
    .filter((t) => t.amount_cents < 0)
    .reduce((s, t) => s + t.amount_cents, 0);

  function downloadPdf() {
    const doc = new jsPDF();
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("USAA Bank \u2014 Account Transactions", 14, 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated ${new Date().toLocaleString("en-US")}`, 14, 20);

    const headers = ["Date", "Description", "Merchant", "Category", "Status", "Account", "Amount"];
    const widths = [24, 44, 30, 24, 18, 34, 24];
    const startY = 40;
    const rowH = 7;
    let y = startY;

    doc.setFillColor(240, 171, 0);
    doc.rect(10, y, 190, rowH, "F");
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    let x = 12;
    headers.forEach((h, i) => {
      doc.text(h, x, y + 5);
      x += widths[i];
    });
    y += rowH;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    filtered.forEach((tx, idx) => {
      if (y > 285) {
        doc.addPage();
        y = 20;
      }
      if (idx % 2 === 1) {
        doc.setFillColor(241, 245, 249);
        doc.rect(10, y, 190, rowH, "F");
      }
      x = 12;
      const cells = [
        tx.posted_at,
        tx.description,
        tx.merchant ?? "",
        tx.category,
        tx.status,
        accountName.get(tx.account_id) ?? "",
        `$${(tx.amount_cents / 100).toFixed(2)}`,
      ];
      cells.forEach((c, i) => {
        const text = c.length > widths[i] / 2.2 ? c.slice(0, Math.floor(widths[i] / 2.2) - 1) + "\u2026" : c;
        doc.text(text, x, y + 5);
        x += widths[i];
      });
      y += rowH;
    });

    doc.save("transactions.pdf");
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Search, filter and export your account activity."
        actions={
          <button onClick={downloadPdf} className="btn-secondary">
            <Download className="h-4 w-4" /> Download PDF
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-slate-500">Money in</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(totalIn)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Money out</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{formatCurrency(totalOut)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Net</p>
          <p className="mt-1 text-lg font-bold text-usaa-900">{formatCurrency(totalIn + totalOut, { showSign: true })}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Results</p>
          <p className="mt-1 text-lg font-bold text-usaa-900">{filtered.length}</p>
        </div>
      </div>

      <div className="card mt-4 p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10"
              placeholder="Search by merchant or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            <option>posted</option>
            <option>pending</option>
          </select>
          <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="All">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">Quick date:</span>
          {[
            { k: "All", label: "All time" },
            { k: "30d", label: "30 days" },
            { k: "90d", label: "90 days" },
          ].map((r) => (
            <button
              key={r.k}
              onClick={() => setRange(r.k)}
              className={
                range === r.k
                  ? "rounded-full bg-usaa-700 px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card mt-4">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              No transactions match those filters.
            </p>
          ) : (
            <div className="min-w-[560px] px-5">
              <TransactionList
                transactions={filtered}
                accountNameFor={(tx) => accountName.get(tx.account_id) ?? null}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
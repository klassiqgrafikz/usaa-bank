"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { formatCurrency } from "@/lib/utils";
import type { Account, Transaction } from "@/lib/types";

interface Statement {
  accountId: string;
  accountName: string;
  month: string;
  monthStart: string;
  startBalance: number;
  endBalance: number;
  credits: number;
  debits: number;
  tx: Transaction[];
}

export function StatementsClient({
  accounts,
  transactions,
}: {
  accounts: Account[];
  transactions: Transaction[];
}) {
  const [accountId, setAccountId] = useState("All");
  const [format, setFormat] = useState<"csv" | "pdf">("csv");

  const statements = useMemo(() => {
    const map = new Map<string, Statement[]>();
    for (const a of accounts) {
      const rows: Statement[] = [];
      const now = new Date();
      for (let i = 0; i <= 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const txs = transactions
          .filter((t) => t.account_id === a.id)
          .filter((t) => {
            const td = new Date(t.posted_at);
            return `${td.getFullYear()}-${td.getMonth()}` === key;
          })
          .sort((x, y) => new Date(x.posted_at).getTime() - new Date(y.posted_at).getTime());
        if (txs.length === 0) continue;
        const credits = txs.filter((t) => t.amount_cents > 0).reduce((s, t) => s + t.amount_cents, 0);
        const debits = txs.filter((t) => t.amount_cents < 0).reduce((s, t) => s + t.amount_cents, 0);
        const net = credits + debits;
        rows.push({
          accountId: a.id,
          accountName: a.name,
          month: d.toLocaleString("en-US", { month: "long", year: "numeric" }),
          monthStart: d.toISOString(),
          startBalance: 0,
          endBalance: net,
          credits,
          debits,
          tx: txs,
        });
      }
      let runningEnd: number | null = null;
      for (const s of rows) {
        const end = runningEnd === null ? a.balance_cents : runningEnd;
        s.endBalance = end;
        s.startBalance = end - (s.credits + s.debits);
        runningEnd = s.startBalance;
      }
      map.set(a.id, rows);
    }
    return map;
  }, [accounts, transactions]);

  const flat = useMemo(() => {
    const rows: Statement[] = [];
    for (const list of statements.values()) rows.push(...list);
    return rows.sort((a, b) => b.monthStart.localeCompare(a.monthStart));
  }, [statements]);

  const visible = accountId === "All" ? flat : flat.filter((s) => s.accountId === accountId);

  function download(stmt: Statement) {
    const rows = [
      ["USAA Bank — Account Statement"],
      ["Account", stmt.accountName],
      ["Period", stmt.month],
      [],
      ["Date", "Description", "Category", "Status", "Amount"],
      ...stmt.tx.map((t) => [
        t.posted_at,
        t.description,
        t.category,
        t.status,
        (t.amount_cents / 100).toFixed(2),
      ]),
      [],
      ["Start balance", (stmt.startBalance / 100).toFixed(2)],
      ["Credits", (stmt.credits / 100).toFixed(2)],
      ["Debits", (stmt.debits / 100).toFixed(2)],
      ["End balance", (stmt.endBalance / 100).toFixed(2)],
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statement-${stmt.accountName.replace(/\s+/g, "-").toLowerCase()}-${stmt.monthStart.slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdf(stmt: Statement) {
    const doc = new jsPDF();
    doc.setFillColor(11, 35, 66);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("USAA", 14, 16);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("ONLINE BANKING  ·  MONTHLY STATEMENT", 14, 23);
    doc.setFillColor(240, 171, 0);
    doc.rect(0, 30, 210, 3, "F");

    doc.setTextColor(11, 35, 66);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(stmt.accountName, 14, 44);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Statement period: ${stmt.month}`, 14, 51);
    doc.text(`Generated ${new Date().toLocaleString("en-US")}`, 14, 57);

    const headers = ["Date", "Description", "Category", "Status", "Amount"];
    const widths = [34, 62, 38, 26, 28];
    const startY = 68;
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
    stmt.tx.forEach((t, idx) => {
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
        t.posted_at,
        t.description,
        t.category,
        t.status,
        (t.amount_cents / 100).toFixed(2),
      ];
      cells.forEach((c, i) => {
        const text = c.length > widths[i] / 2.2 ? c.slice(0, Math.floor(widths[i] / 2.2) - 1) + "\u2026" : c;
        doc.text(text, x, y + 5);
        x += widths[i];
      });
      y += rowH;
    });

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(11, 35, 66);
    const summary = [
      ["Start balance", `$${(stmt.startBalance / 100).toFixed(2)}`],
      ["Credits", `$${(stmt.credits / 100).toFixed(2)}`],
      ["Debits", `$${(stmt.debits / 100).toFixed(2)}`],
      ["End balance", `$${(stmt.endBalance / 100).toFixed(2)}`],
    ] as const;
    summary.forEach(([label, value]) => {
      doc.setFontSize(9);
      doc.text(label, 14, y);
      doc.text(value, 196, y, { align: "right" });
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 3, 196, y + 3);
      y += 8;
    });

    doc.save(
      `statement-${stmt.accountName.replace(/\s+/g, "-").toLowerCase()}-${stmt.monthStart.slice(0, 7)}.pdf`,
    );
  }

  return (
    <>
      <PageHeader
        title="Statements & documents"
        subtitle="Download monthly statements for any of your accounts."
        actions={
          <div className="flex items-center gap-2">
            <select className="input w-44" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="All">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <select className="input w-28" value={format} onChange={(e) => setFormat(e.target.value as "csv" | "pdf")}>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="table-h">
                <th>Period</th>
                <th>Account</th>
                <th>Credits</th>
                <th>Debits</th>
                <th>Balances</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.accountId + s.monthStart} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-800">{s.month}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{s.accountName}</td>
                  <td className="px-4 py-3 text-sm font-medium text-emerald-600">
                    {formatCurrency(s.credits)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{formatCurrency(s.debits)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-usaa-900">
                    {formatCurrency(s.endBalance)}
                    <span className="block text-xs font-normal text-slate-400">
                      {formatCurrency(s.startBalance)} start
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => (format === "pdf" ? downloadPdf(s) : download(s))}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-400">No statements available.</p>
        )}
      </div>

      <div className="card mt-6 p-6">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 text-usaa-600" />
          <div>
            <h2 className="font-bold text-usaa-900">Need a tax document?</h2>
            <p className="mt-1 text-sm text-slate-500">
              Consolidated year-end statements for savings and retirement accounts
              are generated here as well. Use the account filter and pick any
              period to download.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
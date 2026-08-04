"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { jsPDF } from "jspdf";
import { BadgeCheck, CheckCircle2, Download, Loader2, X } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getBankApi } from "@/lib/bank";
import { createClient } from "@/lib/supabase/client";
import type { Account, Transfer } from "@/lib/types";

type Dest = "internal" | "external" | "wire";
type LookupState = "idle" | "checking" | "found" | "missing";

interface Confirmation {
  transferId: string;
  amountCents: number;
  dest: Dest;
  fromName: string;
  toLabel: string;
  frequency: string | null;
  note: string | null;
  createdAt: string;
}

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
  const [lookup, setLookup] = useState<LookupState>("idle");
  const [amount, setAmount] = useState("");
  const [schedule, setSchedule] = useState<"one_time" | "recurring">("one_time");
  const [frequency, setFrequency] = useState("monthly");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = createClient();

  useEffect(() => {
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
  }, []);

  async function lookUpMember(acct: string) {
    setLookup("checking");
    try {
      const { data } = await supabase.rpc("lookup_member_by_account", {
        p_account_number: acct,
      }) as { data: { found: boolean; name?: string } | null };
      if (externalAcct !== acct) return;
      if (data?.found && data.name) {
        setExternalName(data.name);
        setLookup("found");
      } else {
        setExternalName("");
        setLookup("missing");
      }
    } catch {
      if (externalAcct !== acct) return;
      setLookup("missing");
    }
  }

  function onAcctChange(value: string, isWire: boolean) {
    const clean = value.replace(/\D/g, "");
    setExternalAcct(clean);
    if (isWire) {
      setLookup("idle");
      return;
    }
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (clean.length === 10 || clean.length === 16) {
      lookupTimer.current = setTimeout(() => {
        void lookUpMember(clean);
      }, 400);
    } else {
      setExternalName("");
      setLookup("idle");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      const api = await getBankApi();
      let res: { error: { message: string } | null; transferId: string | null };

      if (dest === "internal") {
        res = await api.createTransfer({
          internal: true,
          fromId,
          toId: toInternalId,
          amountCents: cents,
          schedule,
          frequency: schedule === "recurring" ? frequency : null,
          note: note || null,
        });
      } else if (dest === "wire") {
        res = await api.createTransfer({
          internal: false,
          fromId,
          externalName:
            externalName +
            (externalAcct ? ` (ACCT •${externalAcct.slice(-4)})` : ""),
          externalAccount: externalAcct || undefined,
          amountCents: cents,
          schedule,
          frequency: schedule === "recurring" ? frequency : null,
          note: note || null,
          isWire: true,
        });
      } else {
        if (!externalAcct) {
          setError("Enter the recipient account number.");
          return;
        }
        if (lookup !== "found") {
          setError("Account not found. Enter a valid USAA member account number.");
          return;
        }
        res = await api.createTransfer({
          internal: false,
          fromId,
          externalName,
          externalAccount: externalAcct,
          amountCents: cents,
          schedule,
          frequency: schedule === "recurring" ? frequency : null,
          note: note || null,
          isWire: false,
        });
      }

      if (res.error) {
        setError(res.error.message);
        return;
      }

      const fromName = accounts.find((a) => a.id === fromId)?.name ?? "Account";
      const toLabel =
        dest === "internal"
          ? accounts.find((a) => a.id === toInternalId)?.name ?? "Account"
          : externalName;

      setConfirmation({
        transferId: res.transferId ?? crypto.randomUUID(),
        amountCents: cents,
        dest,
        fromName,
        toLabel,
        frequency: schedule === "recurring" ? frequency : null,
        note: note || null,
        createdAt: new Date().toISOString(),
      });
      setAmount("");
      setNote("");
      onChanged?.();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function closeConfirmation() {
    setConfirmation(null);
  }

  function downloadReceiptPdf() {
    if (!confirmation) return;
    const c = confirmation;
    const doc = new jsPDF();

    doc.setFillColor(11, 35, 66);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("USAA", 14, 16);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("ONLINE BANKING  ·  TRANSFER CONFIRMATION", 14, 23);
    doc.setFillColor(240, 171, 0);
    doc.rect(0, 30, 210, 3, "F");

    doc.setFillColor(16, 185, 129);
    doc.rect(14, 40, 182, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(
      c.frequency ? "RECURRING TRANSFER SCHEDULED" : "TRANSFER SUCCESSFUL",
      105,
      48,
      { align: "center" },
    );

    doc.setTextColor(11, 35, 66);
    doc.setFontSize(24);
    doc.text(`-${formatCurrency(c.amountCents)}`, 14, 66);

    const rows: [string, string][] = [
      ["Transaction ID", `TRF-${c.transferId.slice(0, 6).toUpperCase()}`],
      ["Date", formatDate(c.createdAt)],
      [
        "Type",
        c.dest === "internal"
          ? "Internal transfer"
          : c.dest === "wire"
            ? "Wire transfer"
            : "External transfer",
      ],
      ["From account", c.fromName],
      ["To", c.toLabel],
      ["Status", "Completed"],
    ];
    if (c.frequency) rows.push(["Schedule", `Recurring · ${c.frequency}`]);
    if (c.note) rows.push(["Note", c.note]);

    doc.setFontSize(10);
    let y = 82;
    for (const [label, value] of rows) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), 14, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(11, 35, 66);
      doc.text(value, 110, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 4, 196, y + 4);
      y += 12;
    }

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "This receipt confirms your transfer request. Funds may take 1-3 business days to appear.",
      14,
      280,
    );
    doc.text(
      "USAA — protecting the armed forces community for over 100 years.",
      14,
      285,
    );

    doc.save(`usaa-transfer-${c.transferId.slice(0, 6)}.pdf`);
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
                  <label className="label">Account number</label>
                  <input
                    className="input"
                    value={externalAcct}
                    onChange={(e) => onAcctChange(e.target.value, dest === "wire")}
                    placeholder="Enter full account number"
                    inputMode="numeric"
                    required
                  />
                  {dest === "wire" ? (
                    <p className="mt-1 text-xs text-slate-400">
                      Name is entered manually for wire transfers.
                    </p>
                  ) : lookup === "checking" ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Loader2 className="h-3 w-3 animate-spin" /> Checking our member directory…
                    </p>
                  ) : lookup === "found" ? (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <BadgeCheck className="h-3 w-3" /> Verified USAA member
                    </p>
                  ) : lookup === "missing" ? (
                    <p className="mt-1 text-xs text-slate-400">
                      No member account matches this number.
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">
                      Enter a full account number to verify the recipient.
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">
                    {dest === "wire" ? "Recipient name" : "Recipient name"}
                  </label>
                  <input
                    className={cn("input", lookup === "found" && "border-emerald-300 bg-emerald-50")}
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    placeholder={dest === "wire" ? "Recipient" : "Auto-fills when verified"}
                    disabled={dest !== "wire" && lookup === "found"}
                    required
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
                        {t.external_account && ` · •${t.external_account.slice(-4)}`}
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

      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 px-4 pt-16 pb-10">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="relative bg-usaa-900 px-6 py-6 text-center">
              <button
                type="button"
                onClick={closeConfirmation}
                className="absolute right-4 top-4 text-slate-300 transition-colors hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <h2 className="mt-2 text-xl font-extrabold text-white">Transfer successful</h2>
              <p className="mt-1 text-sm text-slate-300">
                {confirmation.frequency
                  ? "Your recurring transfer has been scheduled."
                  : "Your transfer is on its way."}
              </p>
              <p className="mt-3 text-3xl font-extrabold text-white">
                -{formatCurrency(confirmation.amountCents)}
              </p>
            </div>

            <div className="divide-y divide-slate-100 px-6 py-2 text-sm">
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Transaction ID</span>
                <span className="font-semibold text-usaa-900">
                  TRF-{confirmation.transferId.slice(0, 6).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Date</span>
                <span className="font-semibold text-slate-800">{formatDate(confirmation.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">From</span>
                <span className="font-semibold text-slate-800">{confirmation.fromName}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">To</span>
                <span className="font-semibold text-slate-800">{confirmation.toLabel}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-400">Type</span>
                <span className="font-semibold text-slate-800">
                  {confirmation.dest === "internal"
                    ? "Internal transfer"
                    : confirmation.dest === "wire"
                      ? "Wire transfer"
                      : "External transfer"}
                </span>
              </div>
              {confirmation.frequency && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-slate-400">Schedule</span>
                  <span className="font-semibold text-slate-800">
                    Recurring · {confirmation.frequency}
                  </span>
                </div>
              )}
              {confirmation.note && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-slate-400">Note</span>
                  <span className="font-semibold text-slate-800">{confirmation.note}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={downloadReceiptPdf}
                className="btn-secondary flex-1"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
              <button type="button" onClick={closeConfirmation} className="btn-primary flex-1">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

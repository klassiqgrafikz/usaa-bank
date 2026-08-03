"use client";

import { useState } from "react";
import { BellRing } from "lucide-react";
import { PageHeader } from "@/components/banking/page-header";
import { timeAgo, cn } from "@/lib/utils";
import { getBankApi } from "@/lib/bank";
import type { AlertItem, AlertPreference } from "@/lib/types";

type PrefKey = "low_balance" | "large_transaction" | "login_activity" | "bill_due" | "credit_report";

const prefLabels: { key: PrefKey; title: string; body: string }[] = [
  { key: "low_balance", title: "Low balance", body: "Let me know when an account drops below a threshold." },
  { key: "large_transaction", title: "Large transaction", body: "Notify me for purchases over $500." },
  { key: "login_activity", title: "Login activity", body: "Alert me when a new device signs on." },
  { key: "bill_due", title: "Bill pay due", body: "Remind me before scheduled payments post." },
  { key: "credit_report", title: "Credit report", body: "Let me know about changes to my credit score." },
];

export function AlertsClient({
  alerts,
  prefs,
  onChanged,
}: {
  alerts: AlertItem[];
  prefs: AlertPreference | null;
  onChanged?: () => void;
}) {
  const [toggles, setToggles] = useState<Record<PrefKey, boolean>>({
    low_balance: prefs?.low_balance ?? true,
    large_transaction: prefs?.large_transaction ?? true,
    login_activity: prefs?.login_activity ?? true,
    bill_due: prefs?.bill_due ?? true,
    credit_report: prefs?.credit_report ?? false,
  });

  async function toggle(key: PrefKey) {
    const next = { ...toggles, [key]: !toggles[key] };
    setToggles(next);
    const api = await getBankApi();
    await api.setAlertPrefs({
      low_balance: next.low_balance,
      large_transaction: next.large_transaction,
      login_activity: next.login_activity,
      bill_due: next.bill_due,
      credit_report: next.credit_report,
    });
  }

  async function markRead(id: string) {
    const api = await getBankApi();
    await api.markAlertRead(id);
    onChanged?.();
  }

  const unread = alerts.filter((a) => !a.read).length;

  return (
    <>
      <PageHeader
        title="Alerts & notices"
        subtitle="Stay on top of your account activity."
        actions={
          <span className="text-sm text-slate-500">
            {unread} unread
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card divide-y divide-slate-100">
            {alerts.length === 0 && (
              <p className="py-12 text-center text-sm text-slate-400">You&apos;re all caught up.</p>
            )}
            {alerts.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "flex items-start gap-3 px-5 py-4",
                  !a.read && "bg-usaa-50/50",
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                    a.severity === "warning"
                      ? "bg-amber-500"
                      : a.severity === "critical"
                        ? "bg-crimson-600"
                        : a.severity === "success"
                          ? "bg-emerald-500"
                          : "bg-usaa-500",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{a.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(a.created_at)}</p>
                </div>
                {!a.read && (
                  <button onClick={() => markRead(a.id)} className="link text-xs">
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-usaa-700" />
            <h2 className="font-bold text-usaa-900">Alert preferences</h2>
          </div>
          <div className="mt-4 space-y-4">
            {prefLabels.map(({ key, title, body }) => (
              <div key={key} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="text-xs text-slate-400">{body}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={toggles[key]}
                  onClick={() => toggle(key)}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    toggles[key] ? "bg-usaa-700" : "bg-slate-300",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                      toggles[key] ? "left-[22px]" : "left-0.5",
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Alerts are delivered to the email on your account.
          </p>
        </div>
      </div>
    </>
  );
}
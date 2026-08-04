"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  Banknote,
  ChevronRight,
  ReceiptText,
  Send,
} from "lucide-react";
import { useBankData } from "@/lib/use-bank-data";
import { PageHeader } from "@/components/banking/page-header";
import { TransactionList } from "@/components/banking/transaction-row";
import { BalanceChart } from "@/components/banking/balance-chart";
import { CopyValue } from "@/components/banking/copy-value";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { Account, Transaction } from "@/lib/types";

export default function DashboardPage() {
  const { data, error } = useBankData(async (api) => {
    const [accounts, transactions, alerts] = await Promise.all([
      api.getAccounts(),
      api.getTransactions(8),
      api.getAlerts(),
    ]);
    return { accounts, transactions, alerts: alerts.slice(0, 4) };
  });

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-slate-400">Loading your accounts…</p>;
  }

  const { accounts, transactions, alerts } = data;

  const assets = accounts
    .filter((a) => a.type !== "credit_card" && a.type !== "loan")
    .reduce((sum, a) => sum + a.balance_cents, 0);

  const totalAvailable = accounts.reduce(
    (sum, a) => sum + a.available_cents,
    0,
  );

  const primary =
    accounts.find((a) => a.type === "checking") ?? accounts[0] ?? null;

  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const txWithAccount = transactions.map((tx) => ({
    ...tx,
    accountName: accountName.get(tx.account_id) ?? "Account",
  }));

  const chartData = buildChartData(accounts, transactions);

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Here's what's happening with your money today."
      />

      <div className="-mx-4 rounded-none border-b border-white/10 bg-gradient-to-br from-usaa-800 to-usaa-950 p-5 text-white shadow-sm sm:mx-0 sm:rounded-xl sm:border-0 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-300">Total balance</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">
              {formatCurrency(assets)}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Total available {formatCurrency(totalAvailable)}
            </p>
            {primary && (
              <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <span className="min-w-0 truncate text-xs font-medium text-slate-300">
                  {primary.name}
                </span>
                <CopyValue
                  value={primary.account_number}
                  ariaLabel="Copy account number"
                  tone="dark"
                />
              </div>
            )}
          </div>

          <div className="grid w-full grid-cols-2 gap-3 lg:w-80">
            <Link
              href="/bank/transfers"
              className="flex h-full flex-col items-center justify-center gap-1.5 rounded-xl bg-white p-4 text-center shadow-sm transition-transform hover:scale-[1.02] sm:p-5"
            >
              <ArrowLeftRight className="h-5 w-5 text-usaa-700 sm:h-6 sm:w-6" />
              <span className="text-sm font-bold leading-tight text-usaa-900">
                Transfer
              </span>
            </Link>
            <Link
              href="/bank/deposits"
              className="flex h-full flex-col items-center justify-center gap-1.5 rounded-xl bg-white p-4 text-center shadow-sm transition-transform hover:scale-[1.02] sm:p-5"
            >
              <Banknote className="h-5 w-5 text-usaa-700 sm:h-6 sm:w-6" />
              <span className="text-sm font-bold leading-tight text-usaa-900">
                Deposit
              </span>
            </Link>
            <Link
              href="/bank/billpay"
              className="flex h-full flex-col items-center justify-center gap-1.5 rounded-xl border border-white/15 p-4 text-center text-sm font-semibold leading-tight text-slate-200 transition-colors hover:bg-white/10 sm:p-5"
            >
              <ReceiptText className="h-5 w-5 text-slate-200 sm:h-6 sm:w-6" />
              Pay bills
            </Link>
            <Link
              href="/bank/pay"
              className="flex h-full flex-col items-center justify-center gap-1.5 rounded-xl border border-white/15 p-4 text-center text-sm font-semibold leading-tight text-slate-200 transition-colors hover:bg-white/10 sm:p-5"
            >
              <Send className="h-5 w-5 text-slate-200 sm:h-6 sm:w-6" />
              Send money
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-usaa-900">Balance trend</h2>
              <span className="text-xs text-slate-400">Last 6 months</span>
            </div>
            <BalanceChart data={chartData} />
          </div>

          <div className="card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-usaa-900">Recent activity</h2>
              <Link href="/bank/transactions" className="link text-sm">
                View all
              </Link>
            </div>
            <div className="px-5">
              <TransactionList
                transactions={txWithAccount as Transaction[]}
                showAccount
                accountNameFor={(tx) => accountName.get(tx.account_id) ?? null}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-usaa-900">Your accounts</h2>
            <div className="mt-3 space-y-3">
              {accounts.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
                >
                  <Link
                    href={`/bank/accounts/${a.id}`}
                    className="flex min-w-0 flex-1 flex-col"
                  >
                    <span className="truncate text-sm font-semibold text-slate-800">
                      {a.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {a.type === "credit_card"
                        ? "Credit card"
                        : a.type.replace("_", " ")}{" "}
                      · ••{a.account_number.slice(-4)}
                    </span>
                  </Link>
                  <CopyValue
                    value={a.account_number}
                    ariaLabel="Copy account number"
                  />
                  <Link
                    href={`/bank/accounts/${a.id}`}
                    className="shrink-0 text-right text-sm font-bold text-usaa-900"
                  >
                    {(a.type === "credit_card" || a.type === "loan") &&
                    a.balance_cents > 0
                      ? "-"
                      : ""}
                    {formatCurrency(Math.abs(a.balance_cents))}
                  </Link>
                </div>
              ))}
            </div>
            <Link
              href="/bank/accounts"
              className="link mt-3 inline-flex items-center gap-1 text-sm"
            >
              All accounts <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-usaa-900">Alerts</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {alerts.map((a) => (
                <Link
                  key={a.id}
                  href="/bank/alerts"
                  className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <span
                    className={
                      a.severity === "warning"
                        ? "mt-1.5 h-2 w-2 rounded-full bg-amber-500"
                        : a.severity === "critical"
                          ? "mt-1.5 h-2 w-2 rounded-full bg-crimson-600"
                          : a.severity === "success"
                            ? "mt-1.5 h-2 w-2 rounded-full bg-emerald-500"
                            : "mt-1.5 h-2 w-2 rounded-full bg-usaa-500"
                    }
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{a.title}</p>
                    <p className="truncate text-xs text-slate-400">
                      {formatDateShort(a.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function buildChartData(accounts: Account[], transactions: Transaction[]) {
  const checking = accounts.find((a) => a.type === "checking");
  const now = new Date();

  if (!checking) {
    return Array.from({ length: 6 }, (_, i) => ({
      label: new Date(now.getFullYear(), now.getMonth() - (5 - i), 1).toLocaleString("en-US", { month: "short" }),
      amount: 0,
    }));
  }

  // Monthly net change per account, oldest month first.
  const monthly: number[] = Array(6).fill(0);
  for (const tx of transactions) {
    if (tx.account_id !== checking.id) continue;
    const d = new Date(tx.posted_at);
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
    if (monthsAgo >= 0 && monthsAgo < 6) {
      monthly[5 - monthsAgo] += tx.amount_cents;
    }
  }

  // Walk backwards from the current balance so the last point is exact.
  let running = checking.balance_cents;
  const points: { label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    points.unshift({
      label: monthStart.toLocaleString("en-US", { month: "short" }),
      amount: running,
    });
    running -= monthly[i];
  }
  return points;
}

"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  ReceiptText,
  Send,
  Camera,
  ChevronRight,
} from "lucide-react";
import { useBankData } from "@/lib/use-bank-data";
import { PageHeader } from "@/components/banking/page-header";
import { TransactionList } from "@/components/banking/transaction-row";
import { BalanceChart } from "@/components/banking/balance-chart";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { Account, Transaction } from "@/lib/types";

export default function DashboardPage() {
  const { data, error, reload } = useBankData(async (api) => {
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
  void reload;

  const assets = accounts
    .filter((a) => a.type !== "credit_card" && a.type !== "loan")
    .reduce((sum, a) => sum + a.balance_cents, 0);
  const liabilities = accounts
    .filter((a) => a.type === "credit_card" || a.type === "loan")
    .reduce((sum, a) => sum + a.balance_cents, 0);
  const netWorth = assets - liabilities;

  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const txWithAccount = transactions.map((tx) => ({
    ...tx,
    accountName: accountName.get(tx.account_id) ?? "Account",
  }));

  const chartData = buildChartData(accounts);

  const totalAvailable = accounts.reduce(
    (sum, a) =>
      sum +
      (a.type === "credit_card" && a.credit_limit_cents
        ? a.credit_limit_cents - a.balance_cents
        : a.available_cents),
    0,
  );

  const quickActions = [
    { href: "/bank/transfers", label: "Transfer", icon: ArrowLeftRight },
    { href: "/bank/billpay", label: "Pay bills", icon: ReceiptText },
    { href: "/bank/pay", label: "Send money", icon: Send },
    { href: "/bank/deposits", label: "Deposit a check", icon: Camera },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Here's what's happening with your money today."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-xs font-medium text-slate-500">Total balance</p>
              <p className="mt-1 text-2xl font-extrabold text-usaa-900">
                {formatCurrency(assets)}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-slate-500">Net worth</p>
              <p className="mt-1 text-2xl font-extrabold text-usaa-900">
                {formatCurrency(netWorth)}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-medium text-slate-500">Total available</p>
              <p className="mt-1 text-2xl font-extrabold text-usaa-900">
                {formatCurrency(totalAvailable)}
              </p>
            </div>
          </div>

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
              <TransactionList transactions={txWithAccount as Transaction[]} showAccount />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-usaa-900">Quick actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {quickActions.map((qa) => (
                <Link
                  key={qa.label}
                  href={qa.href}
                  className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 p-4 text-center transition-colors hover:border-usaa-400 hover:bg-usaa-50"
                >
                  <qa.icon className="h-5 w-5 text-usaa-700" />
                  <span className="text-xs font-semibold text-slate-700">
                    {qa.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-usaa-900">Your accounts</h2>
            <div className="mt-3 space-y-3">
              {accounts.slice(0, 4).map((a) => (
                <Link
                  key={a.id}
                  href={`/bank/accounts/${a.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                    <p className="text-xs text-slate-400">
                      {a.type === "credit_card" ? "Credit card" : a.type.replace("_", " ")} · ••{a.account_number.slice(-4)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-usaa-900">
                    {a.type === "credit_card" || a.type === "loan" ? "-" : ""}
                    {formatCurrency(Math.abs(a.balance_cents))}
                  </p>
                </Link>
              ))}
            </div>
            <Link href="/bank/accounts" className="link mt-3 inline-flex items-center gap-1 text-sm">
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

function buildChartData(accounts: Account[]) {
  const checking = accounts.find((a) => a.type === "checking");
  if (!checking) {
    return Array.from({ length: 6 }, (_, i) => ({
      label: new Date(new Date().setMonth(new Date().getMonth() - (5 - i))).toLocaleString("en-US", { month: "short" }),
      amount: 0,
    }));
  }

  const months: { label: string; amount: number }[] = [];
  const now = new Date();
  const running = checking.balance_cents;

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: monthStart.toLocaleString("en-US", { month: "short" }),
      amount: running - i * 4200, // gentle downward walk for a believable line
    });
  }
  return months;
}
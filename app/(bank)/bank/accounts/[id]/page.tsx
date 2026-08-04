"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  Camera,
  ChevronDown,
  Lock,
} from "lucide-react";
import { useBankData } from "@/lib/use-bank-data";
import { PageHeader } from "@/components/banking/page-header";
import { TransactionList } from "@/components/banking/transaction-row";
import { BalanceChart } from "@/components/banking/balance-chart";
import { CopyValue } from "@/components/banking/copy-value";
import { formatCurrency, formatDate, titleCase, cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const { data, error } = useBankData(async (api) => {
    const account = await api.getAccount(id);
    if (!account) return { account: null, transactions: [], cards: [] };
    const [transactions, cards] = await Promise.all([
      api.getTransactionsByAccount(id),
      api.getCardsByAccount(id),
    ]);
    return {
      account,
      transactions: transactions.slice(0, 50),
      cards,
    };
  });

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-slate-400">Loading account…</p>;

  const { account, transactions } = data;
  const cards = data.cards;

  if (!account) {
    return (
      <>
        <p className="text-sm text-slate-500">We couldn&apos;t find that account.</p>
        <Link href="/bank/accounts" className="link mt-2 inline-block text-sm">
          Back to all accounts
        </Link>
      </>
    );
  }

  const isOwed = account.type === "credit_card" || account.type === "loan";
  const available =
    account.type === "credit_card" && account.credit_limit_cents
      ? account.credit_limit_cents - account.balance_cents
      : account.available_cents;

  const chartData = buildChartData(transactions, account.balance_cents);

  return (
    <>
      <Link
        href="/bank/accounts"
        className="mb-3 inline-flex items-center gap-1 text-sm text-usaa-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> All accounts
      </Link>

      <PageHeader
        title={account.name}
        subtitle={titleCase(account.type.replace("_", " "))}
      />

      {account.restricted && (
        <div className="mb-6 rounded-md border border-crimson-200 bg-crimson-50 px-4 py-3">
          <p className="text-sm font-bold text-crimson-700">
            This account is restricted
          </p>
          <p className="mt-0.5 text-sm text-crimson-600">
            {account.restriction_reason ??
              "No reason was provided by our support team."}
            {account.restriction_until && (
              <>
                {" "}
                Restriction is scheduled to lift on{" "}
                {formatDate(account.restriction_until)}.
              </>
            )}{" "}
            You cannot send money from this account.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-usaa-800 to-usaa-950 p-6 text-white">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">{account.name}</p>
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  <Lock className="h-3 w-3" /> Verified
                </span>
              </div>
              <p className="mt-8 text-4xl font-extrabold">
                {isOwed && account.balance_cents > 0 ? "-" : ""}
                {formatCurrency(Math.abs(account.balance_cents))}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {isOwed
                  ? account.type === "credit_card"
                    ? `${formatCurrency(available)} available credit`
                    : "Current payoff amount"
                  : `${formatCurrency(account.available_cents)} available`}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-sm text-slate-300">
                <span>•••• •••• •••• {account.account_number.slice(-4)}</span>
                <span>VISA</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-usaa-900">Account activity</h2>
              <Link href={`/bank/transactions?account=${id}`} className="link text-sm">
                View all
              </Link>
            </div>
            <div className="mb-4">
              <BalanceChart data={chartData} />
            </div>
            <TransactionList
              transactions={transactions.slice(0, 12)}
              accountNameFor={() => account.name}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-usaa-900">Account essentials</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Account number">
                <CopyValue value={account.account_number} ariaLabel="Copy account number" />
              </Row>
              <Row label="Routing number">
                <CopyValue value={account.routing_number} ariaLabel="Copy routing number" />
              </Row>
              <Row label="Opened">
                {formatDate(account.opened_at)}
              </Row>
              {account.apy != null && (
                <Row label="Dividend rate (APY)">
                  {account.apy.toFixed(2)}%
                </Row>
              )}
              {account.apr != null && (
                <Row label="APR">{account.apr.toFixed(2)}%</Row>
              )}
              <Row label="Status">
                <span className="capitalize">{account.status}</span>
              </Row>
            </dl>
          </div>

          {account.type === "credit_card" && (
            <div className="card p-5">
              <h2 className="font-bold text-usaa-900">Credit card</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {account.credit_limit_cents != null && (
                  <Row label="Credit limit">{formatCurrency(account.credit_limit_cents)}</Row>
                )}
                <Row label="Available">{formatCurrency(available)}</Row>
                <Row label="Balance">{formatCurrency(account.balance_cents)}</Row>
                <Row label="Min. payment due">
                  {formatCurrency(minPayment(account.balance_cents))}
                </Row>
              </dl>
            </div>
          )}

          {account.type === "loan" && (
            <div className="card p-5">
              <h2 className="font-bold text-usaa-900">Loan</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <Row label="Principal balance">{formatCurrency(account.balance_cents)}</Row>
                <Row label="Interest rate">
                  {account.apr != null ? `${account.apr.toFixed(2)}%` : "—"}
                </Row>
                <Row label="Next payment">{formatCurrency(minPayment(account.balance_cents))}</Row>
              </dl>
            </div>
          )}

          <div className="card p-5">
            <h2 className="font-bold text-usaa-900">Cards on this account</h2>
            <div className="mt-3 space-y-2">
              {cards.length === 0 && (
                <p className="text-sm text-slate-400">No cards linked.</p>
              )}
              {cards.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {c.card_type === "debit" ? "Debit" : "Credit"} ·••• {c.card_last4}
                    </p>
                    <p className="text-xs text-slate-400">
                      {c.brand} · Expires {c.expires}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                      c.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-usaa-900">Actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ActionCta href="/bank/transfers" label="Transfer" icon={ArrowLeftRight} />
              <ActionCta
                href={`/bank/deposits?account=${account.id}`}
                label="Deposit"
                icon={Camera}
              />
              {(account.type === "credit_card" || account.type === "loan") && (
                <ActionCta href="/bank/billpay" label="Pay" icon={ChevronDown} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="flex items-center text-slate-800">{children}</dd>
    </div>
  );
}

function ActionCta({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-700 transition-colors hover:border-usaa-400 hover:bg-usaa-50"
    >
      <Icon className="h-4 w-4 text-usaa-700" />
      {label}
    </Link>
  );
}

function minPayment(balance: number) {
  if (balance <= 0) return 0;
  return Math.max(Math.round(balance * 0.02), 2500);
}

function buildChartData(
  transactions: Transaction[],
  finalBalance: number,
) {
  const posted = transactions
    .filter((t) => t.status === "posted")
    .sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime())
    .slice(0, 30);

  const points: { label: string; amount: number }[] = [];
  let running = finalBalance;
  const reversed = [...posted].reverse();
  reversed.forEach((t) => {
    running -= t.amount_cents;
    points.push({
      label: new Date(t.posted_at).toLocaleString("en-US", { month: "short", day: "numeric" }),
      amount: running,
    });
  });
  if (points.length === 0) {
    return [
      { label: "Today", amount: finalBalance },
    ];
  }
  return points;
}
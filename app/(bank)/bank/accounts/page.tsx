"use client";

import { useBankData } from "@/lib/use-bank-data";
import { PageHeader } from "@/components/banking/page-header";
import { AccountCard } from "@/components/banking/account-card";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/lib/types";

export default function AccountsPage() {
  const { data, error } = useBankData(async (api) => {
    const accounts = await api.getAccounts();
    const groups: Record<string, Account[]> = {
      checking: [],
      savings: [],
      credit_card: [],
      loan: [],
      investment: [],
    };
    for (const a of accounts) groups[a.type] ??= [];
    for (const a of accounts) groups[a.type].push(a);
    return { accounts, groups };
  });

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-slate-400">Loading your accounts…</p>;

  const { groups } = data;

  const labels: Record<string, string> = {
    checking: "Checking accounts",
    savings: "Savings accounts",
    credit_card: "Credit cards",
    loan: "Loans",
    investment: "Investments & retirement",
  };

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle="All accounts linked to your membership."
        actions={
          <span className="text-sm text-slate-500">
            Total balance{" "}
            <span className="font-bold text-usaa-900">
              {formatCurrency(
                (["checking", "savings", "investment"] as const).reduce(
                  (s, t) => s + groups[t].reduce((x, a) => x + a.balance_cents, 0),
                  0,
                ),
              )}
            </span>
          </span>
        }
      />

      <div className="space-y-10">
        {Object.entries(groups).map(([type, list]) => {
          if (list.length === 0) return null;
          return (
            <section key={type}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                {labels[type]}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
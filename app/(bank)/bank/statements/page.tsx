"use client";

import { useBankData } from "@/lib/use-bank-data";
import { StatementsClient } from "./statements-client";

export default function StatementsPage() {
  const { data, error } = useBankData(async (api) => {
    const [accounts, transactions] = await Promise.all([
      api.getAccounts(),
      api.getTransactions(5000),
    ]);
    return { accounts, transactions };
  });

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) {
    return <p className="text-sm text-slate-400">Loading statements…</p>;
  }

  return (
    <StatementsClient
      accounts={data.accounts}
      transactions={data.transactions}
    />
  );
}
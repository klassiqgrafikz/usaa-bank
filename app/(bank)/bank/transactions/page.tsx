"use client";

import { useBankData } from "@/lib/use-bank-data";
import { TransactionsClient } from "./transactions-client";
import { isMockMode } from "@/lib/mock";

export default function TransactionsPage() {
  const { data, error } = useBankData(async (api) => {
    const [transactions, accounts] = await Promise.all([
      api.getTransactions(500),
      api.getAccounts(),
    ]);
    return { transactions, accounts };
  }, [isMockMode()]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) {
    return <p className="text-sm text-slate-400">Loading transactions…</p>;
  }

  return (
    <TransactionsClient
      initialTransactions={data.transactions}
      accounts={data.accounts}
    />
  );
}
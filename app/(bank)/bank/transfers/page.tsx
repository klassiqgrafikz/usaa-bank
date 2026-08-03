"use client";

import { useBankData } from "@/lib/use-bank-data";
import { TransfersClient } from "./transfers-client";

export default function TransfersPage() {
  const { data, error, reload } = useBankData(async (api) => {
    const [accounts, transfers] = await Promise.all([
      api.getAccounts(),
      api.getTransfers(),
    ]);
    return { accounts, transfers: transfers.slice(0, 50) };
  });

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) {
    return <p className="text-sm text-slate-400">Loading transfers…</p>;
  }

  return (
    <TransfersClient
      accounts={data.accounts}
      transfers={data.transfers}
      onChanged={reload}
    />
  );
}
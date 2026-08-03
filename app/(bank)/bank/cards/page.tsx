"use client";

import { useBankData } from "@/lib/use-bank-data";
import { CardsClient } from "./cards-client";

export default function CardsPage() {
  const { data, error, reload } = useBankData(async (api) => {
    const [cards, disputes, transactions, accounts] = await Promise.all([
      api.getCards(),
      api.getDisputes(),
      api.getTransactions(1000),
      api.getAccounts(),
    ]);
    return { cards, disputes, transactions, accounts };
  });

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) {
    return <p className="text-sm text-slate-400">Loading cards…</p>;
  }

  return (
    <CardsClient
      cards={data.cards}
      disputes={data.disputes}
      transactions={data.transactions}
      accounts={data.accounts}
      onChanged={reload}
    />
  );
}
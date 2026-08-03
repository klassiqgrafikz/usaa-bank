"use client";

import { useBankData } from "@/lib/use-bank-data";
import { PayClient } from "./pay-client";
import { isMockMode } from "@/lib/mock";

export default function PayPage() {
  const { data, error, reload } = useBankData(async (api) => {
    const [contacts, transfers, accounts] = await Promise.all([
      api.getZelleContacts(),
      api.getZelleTransfers(),
      api.getAccounts(),
    ]);
    return { contacts, transfers: transfers.slice(0, 50), accounts };
  }, [isMockMode()]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) {
    return <p className="text-sm text-slate-400">Loading Zelle…</p>;
  }

  return (
    <PayClient
      contacts={data.contacts}
      transfers={data.transfers}
      accounts={data.accounts}
      onChanged={reload}
    />
  );
}
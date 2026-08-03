"use client";

import { useBankData } from "@/lib/use-bank-data";
import { DepositsClient } from "./deposits-client";
import { isMockMode } from "@/lib/mock";

export default function DepositsPage() {
  const { data, error, reload } = useBankData(async (api) => {
    const accounts = await api.getAccounts();
    return { accounts };
  }, [isMockMode()]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) {
    return <p className="text-sm text-slate-400">Loading deposits…</p>;
  }

  return <DepositsClient accounts={data.accounts} onChanged={reload} />;
}
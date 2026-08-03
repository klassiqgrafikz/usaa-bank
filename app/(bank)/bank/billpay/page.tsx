"use client";

import { useBankData } from "@/lib/use-bank-data";
import { BillPayClient } from "./billpay-client";
import { isMockMode } from "@/lib/mock";

export default function BillPayPage() {
  const { data, error, reload } = useBankData(async (api) => {
    const [payees, payments, accounts] = await Promise.all([
      api.getPayees(),
      api.getPayments(),
      api.getAccounts(),
    ]);
    return { payees, payments: payments.slice(0, 50), accounts };
  }, [isMockMode()]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) {
    return <p className="text-sm text-slate-400">Loading bill pay…</p>;
  }

  return (
    <BillPayClient
      payees={data.payees}
      payments={data.payments}
      accounts={data.accounts}
      onChanged={reload}
    />
  );
}
import { ArrowDownLeft, ArrowUpRight, type LucideIcon } from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

const categoryColors: Record<string, string> = {
  Income: "bg-emerald-50 text-emerald-700",
  Transfer: "bg-usaa-50 text-usaa-700",
  Groceries: "bg-lime-50 text-lime-700",
  Dining: "bg-orange-50 text-orange-700",
  Shopping: "bg-violet-50 text-violet-700",
  Travel: "bg-sky-50 text-sky-700",
  "Bill Pay": "bg-rose-50 text-rose-700",
  Utilities: "bg-cyan-50 text-cyan-700",
  Fuel: "bg-yellow-50 text-yellow-700",
  Entertainment: "bg-pink-50 text-pink-700",
  Health: "bg-teal-50 text-teal-700",
  Loan: "bg-slate-100 text-slate-700",
  Rewards: "bg-gold-400/20 text-amber-700",
};

export function TransactionRow({
  tx,
  showAccount = false,
}: {
  tx: Transaction;
  showAccount?: boolean;
}) {
  const incoming = tx.amount_cents > 0;
  const Icon: LucideIcon = incoming ? ArrowDownLeft : ArrowUpRight;
  const color = categoryColors[tx.category] ?? "bg-slate-100 text-slate-700";

  return (
    <div className="flex items-center gap-4 py-3">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {tx.description}
        </p>
        <p className="text-xs text-slate-400">
          {formatDate(tx.posted_at)}
          {tx.status === "pending" && <span className="ml-2 text-amber-600">Pending</span>}
          {showAccount && <span className="ml-2">••{tx.account_id?.slice(0, 4)}</span>}
        </p>
      </div>
      <p
        className={cn(
          "shrink-0 whitespace-nowrap text-sm font-semibold",
          incoming ? "text-emerald-600" : "text-slate-800",
        )}
      >
        {incoming ? "+" : "-"}
        {formatCurrency(Math.abs(tx.amount_cents))}
      </p>
    </div>
  );
}

export function TransactionList({
  transactions,
  showAccount = false,
}: {
  transactions: Transaction[];
  showAccount?: boolean;
}) {
  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        No transactions found.
      </p>
    );
  }
  return (
    <div className="divide-y divide-slate-100">
      {transactions.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} showAccount={showAccount} />
      ))}
    </div>
  );
}
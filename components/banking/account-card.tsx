import Link from "next/link";
import {
  CreditCard,
  Landmark,
  PiggyBank,
  Settings2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  formatCurrency,
  titleCase,
  cn,
} from "@/lib/utils";
import type { Account } from "@/lib/types";

const iconByType: Record<string, LucideIcon> = {
  checking: Landmark,
  savings: PiggyBank,
  credit_card: CreditCard,
  loan: Settings2,
  investment: TrendingUp,
};

const accentByType: Record<string, string> = {
  checking: "bg-usaa-50 text-usaa-700",
  savings: "bg-emerald-50 text-emerald-700",
  credit_card: "bg-crimson-50 text-crimson-600",
  loan: "bg-amber-50 text-amber-700",
  investment: "bg-indigo-50 text-indigo-700",
};

export function accountBalance(account: Account) {
  // Credit accounts: outstanding shown positive; loan accounts show payoff.
  if (account.type === "credit_card") return account.balance_cents;
  if (account.type === "loan") return account.balance_cents;
  return account.balance_cents;
}

export function AccountCard({ account }: { account: Account }) {
  const Icon = accentByType[account.type]
    ? iconByType[account.type]
    : Landmark;
  const isOwed = account.type === "credit_card" || account.type === "loan";
  const value = isOwed ? -account.balance_cents : account.balance_cents;

  return (
    <Link
      href={`/bank/accounts/${account.id}`}
      className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            accentByType[account.type] ?? "bg-usaa-50 text-usaa-700",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-slate-400">
          {titleCase(account.type.replace("_", " "))}
        </span>
      </div>
      <p className="mt-4 truncate text-sm font-semibold text-slate-700">
        {account.name}
      </p>
      <p className="mt-1 text-2xl font-extrabold text-usaa-900">
        {isOwed && value > 0 ? "-" : ""}
        {formatCurrency(Math.abs(value), { showSign: value > 0 })}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-400">••{account.account_number.slice(-4)}</span>
        {account.type === "credit_card" && account.credit_limit_cents ? (
          <span className="font-medium text-slate-500">
            {formatCurrency(account.credit_limit_cents - account.balance_cents)} available
          </span>
        ) : (
          <span className="font-medium text-slate-500">
            Available {formatCurrency(account.available_cents)}
          </span>
        )}
      </div>
    </Link>
  );
}
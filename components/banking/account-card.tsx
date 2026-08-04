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
  formatDate,
  cn,
} from "@/lib/utils";
import { CopyValue } from "@/components/banking/copy-value";
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

export function AccountCard({ account }: { account: Account }) {
  const Icon = accentByType[account.type]
    ? iconByType[account.type]
    : Landmark;
  const isOwed = account.type === "credit_card" || account.type === "loan";
  const value = isOwed ? -account.balance_cents : account.balance_cents;
  const isDeposit = account.type === "checking" || account.type === "savings";

  return (
    <Link
      href={`/bank/accounts/${account.id}`}
      className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
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
      <p className="mt-4 truncate text-base font-semibold text-slate-700">
        {account.name}
      </p>
      <p className="mt-1 text-3xl font-extrabold text-usaa-900">
        {isOwed && value > 0 ? "-" : ""}
        {formatCurrency(Math.abs(value), { showSign: value > 0 })}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <CopyValue
          value={account.account_number}
          ariaLabel={`Copy account number ${account.account_number}`}
        />
        {isDeposit && (
          <CopyValue
            value={account.routing_number}
            ariaLabel={`Copy routing number ${account.routing_number}`}
          />
        )}
        <span className="text-xs text-slate-400">
          ••{account.account_number.slice(-4)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs">
        {account.type === "credit_card" ? (
          <>
            {account.apr != null && (
              <span className="font-medium text-slate-500">
                APR {account.apr}%
              </span>
            )}
            {account.credit_limit_cents != null && (
              <span className="font-medium text-slate-500">
                {formatCurrency(account.credit_limit_cents)} limit
              </span>
            )}
            <span className="font-semibold text-usaa-900">
              {account.credit_limit_cents != null
                ? formatCurrency(account.credit_limit_cents - account.balance_cents)
                : "No limit"}
            </span>
          </>
        ) : (
          <>
            {account.apy != null && (
              <span className="font-medium text-slate-500">
                APY {account.apy}%
              </span>
            )}
            <span className="font-medium text-slate-500">
              Available {formatCurrency(account.available_cents)}
            </span>
          </>
        )}
        <span className="text-slate-400">
          Opened {formatDate(account.opened_at)}
        </span>
      </div>
    </Link>
  );
}

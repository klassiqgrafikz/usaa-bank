"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Banknote,
  FileText,
  Send,
  Landmark,
  ReceiptText,
  Bell,
  CreditCard,
  ShieldCheck,
  UserRound,
  LifeBuoy,
  LogOut,
  RefreshCw,
  Search,
} from "lucide-react";
import { initials } from "@/lib/utils";
import { isMockMode } from "@/lib/mock";
import { getBankApi } from "@/lib/bank";
import type { Profile } from "@/lib/types";

const nav = [
  { href: "/bank/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bank/accounts", label: "Accounts", icon: Wallet },
  { href: "/bank/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/bank/transfers", label: "Transfers", icon: Banknote },
  { href: "/bank/billpay", label: "Bill pay", icon: ReceiptText },
  { href: "/bank/pay", label: "Zelle", icon: Send },
  { href: "/bank/deposits", label: "Deposits", icon: Landmark },
  { href: "/bank/statements", label: "Statements", icon: FileText },
] as const;

const settings = [
  { href: "/bank/alerts", label: "Alerts & notices", icon: Bell },
  { href: "/bank/cards", label: "Cards", icon: CreditCard },
  { href: "/bank/security", label: "Security", icon: ShieldCheck },
  { href: "/bank/profile", label: "Profile", icon: UserRound },
  { href: "/bank/help", label: "Help", icon: LifeBuoy },
] as const;

function SidebarLink({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={active ? "sidebar-link-active" : "sidebar-link"}>
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {label}
    </Link>
  );
}

export function BankShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    if (isMockMode()) {
      router.push("/login");
      router.refresh();
      return;
    }
    const supabase = (await import("@/lib/supabase/client")).createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-usaa-900 lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <span className="text-xl font-extrabold text-white">
            USAA<span className="text-crimson-500">.</span>
          </span>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-gold-400">
            DEMO
          </span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Overview
          </p>
          {nav.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              pathname={pathname}
            />
          ))}
          <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Settings
          </p>
          {settings.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              pathname={pathname}
            />
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => {
              const ok = window.confirm(
                "Reset all of your demo data back to the sample starting point?",
              );
              if (ok) {
                void getBankApi().then(async (api) => {
                  await api.resetDemo();
                  router.refresh();
                });
              }
            }}
            className="mb-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            Reset demo data
          </button>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign off
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <Link href="/bank/dashboard" className="lg:hidden">
            <span className="text-lg font-extrabold text-usaa-900">
              USAA<span className="text-crimson-600">.</span>
            </span>
          </Link>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <input
              className="input pl-9"
              placeholder="Search accounts, transactions…"
              aria-label="Search"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/bank/alerts"
              className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Alerts"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-usaa-700 text-xs font-bold text-white">
                {profile ? initials(profile.first_name, profile.last_name) : "U"}
              </div>
              <span className="hidden text-sm font-semibold text-slate-700 md:block">
                {profile ? `${profile.first_name} ${profile.last_name}` : "Member"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>

        <footer className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
          Demonstration environment. Sample data only — not affiliated with USAA.
        </footer>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
  Menu,
  Search,
  X,
  CheckCheck,
  Settings2,
} from "lucide-react";
import { getBankApi } from "@/lib/bank";
import { initials, timeAgo, cn } from "@/lib/utils";
import { TawkWidget } from "@/components/banking/tawk-widget";
import type { AlertItem, Profile } from "@/lib/types";

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
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
  onClick?: () => void;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={active ? "sidebar-link-active" : "sidebar-link"}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {label}
    </Link>
  );
}

function SidebarNav({
  pathname,
  signOut,
  onClose,
  showAdmin,
}: {
  pathname: string;
  signOut: () => void;
  onClose?: () => void;
  showAdmin: boolean;
}) {
  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Link href="/bank/dashboard" onClick={onClose}>
          <span className="inline-flex items-center gap-2 text-xl font-extrabold text-white">
            <img
              src="/images/usaa-logo.svg"
              alt=""
              aria-hidden="true"
              className="h-8 w-auto brightness-0 invert"
            />
            USAA
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
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
            onClick={onClose}
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
            onClick={onClose}
          />
        ))}
        {showAdmin && (
          <SidebarLink
            href="/pages/admin"
            label="Admin"
            icon={Settings2}
            pathname={pathname}
            onClick={onClose}
          />
        )}
      </nav>
      <div className="border-t border-white/10 p-4">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Sign off
        </button>
      </div>
    </>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [bellOpen, setBellOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  const loadAlerts = useCallback(async () => {
    const api = await getBankApi();
    const [count, list] = await Promise.all([
      api.getUnreadAlertCount(),
      api.getRecentAlerts(8),
    ]);
    setAlertCount(count);
    setRecentAlerts(list);
  }, []);

  useEffect(() => {
    const id = setInterval(loadAlerts, 45000);
    queueMicrotask(loadAlerts);
    return () => clearInterval(id);
  }, [loadAlerts]);

  useEffect(() => {
    queueMicrotask(loadAlerts);
  }, [pathname, loadAlerts]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    if (!bellOpen) return;
    function onPointer(e: PointerEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setBellOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [bellOpen]);

  async function markAllRead() {
    const api = await getBankApi();
    await api.markAllAlertsRead();
    setAlertCount(0);
    setRecentAlerts((list) => list.map((a) => ({ ...a, read: true })));
  }

  async function openAlert(a: AlertItem) {
    setBellOpen(false);
    if (!a.read) {
      const api = await getBankApi();
      await api.markAlertRead(a.id);
    }
    router.push("/bank/alerts");
  }

  async function signOut() {
    const supabase = (await import("@/lib/supabase/client")).createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-usaa-900 lg:flex">
        <SidebarNav
          pathname={pathname}
          signOut={signOut}
          showAdmin={!!profile?.is_admin}
        />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-usaa-900 shadow-xl">
            <SidebarNav
              pathname={pathname}
              signOut={signOut}
              onClose={() => setMenuOpen(false)}
              showAdmin={!!profile?.is_admin}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/bank/dashboard" className="lg:hidden">
            <span className="inline-flex items-center gap-2 text-lg font-extrabold text-usaa-900">
              <img
                src="/images/usaa-logo.svg"
                alt=""
                aria-hidden="true"
                className="h-7 w-auto"
              />
              USAA
            </span>
          </Link>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <input
              className="input pl-10"
              placeholder="Search accounts, transactions…"
              aria-label="Search"
            />
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {alertCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson-600 px-1 text-[10px] font-bold text-white">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-bold text-usaa-900">Notifications</p>
                    {alertCount > 0 && (
                      <button onClick={markAllRead} className="link flex items-center gap-1 text-xs">
                        <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                    {recentAlerts.length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-slate-400">
                        No notifications yet.
                      </p>
                    )}
                    {recentAlerts.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => openAlert(a)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50",
                          !a.read && "bg-usaa-50/50",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                            a.severity === "warning"
                              ? "bg-amber-500"
                              : a.severity === "critical"
                                ? "bg-crimson-600"
                                : a.severity === "success"
                                  ? "bg-emerald-500"
                                  : "bg-usaa-500",
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-800">
                            {a.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">
                            {a.message}
                          </span>
                          <span className="mt-1 block text-[11px] text-slate-400">
                            {timeAgo(a.created_at)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 p-2">
                    <Link
                      href="/bank/alerts"
                      onClick={() => setBellOpen(false)}
                      className="block rounded-md px-3 py-2 text-center text-sm font-semibold text-usaa-700 hover:bg-slate-50"
                    >
                      View all alerts
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/bank/profile" className="flex items-center gap-2">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-usaa-700 text-xs font-bold text-white">
                  {profile ? initials(profile.first_name, profile.last_name) : "U"}
                </div>
              )}
              <span className="hidden text-sm font-semibold text-slate-700 md:block">
                {profile ? `${profile.first_name} ${profile.last_name}` : "Member"}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>

        <footer className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
          © {new Date().getFullYear()} USAA Federal Savings Bank. All rights
          reserved.
        </footer>
      </div>

      <TawkWidget />
    </div>
  );
}
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Wallet,
  MessageSquare,
  Wrench,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { href: "/pages/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/pages/admin/accounts", label: "Accounts", icon: Users },
  { href: "/pages/admin/funds", label: "Add funds", icon: Wallet },
  { href: "/pages/admin/restrictions", label: "Restrictions", icon: ShieldAlert },
  { href: "/pages/admin/chat", label: "Live chat", icon: MessageSquare },
  { href: "/pages/admin/site", label: "Website", icon: Wrench },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    const supabase = (await import("@/lib/supabase/client")).createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const sidebar = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Link href="/pages/admin" onClick={closeMenu}>
          <span className="inline-flex items-center gap-2 text-xl font-extrabold text-white">
            <img
              src="/images/usaa-logo.svg"
              alt=""
              aria-hidden="true"
              className="h-8 w-auto brightness-0 invert"
            />
            USAA <span className="text-gold-400">Admin</span>
          </span>
        </Link>
        <button
          onClick={closeMenu}
          aria-label="Close menu"
          className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((item) => {
          const active =
            item.href === "/pages/admin"
              ? pathname === "/pages/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className={
                active
                  ? "flex items-center gap-2 rounded-md bg-usaa-700 px-3 py-2 text-sm font-semibold text-white"
                  : "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-4">
        <Link
          href="/bank/dashboard"
          onClick={closeMenu}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
        >
          Back to member site
        </Link>
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

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-usaa-900 lg:flex">
        {sidebar}
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
            onClick={closeMenu}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-usaa-900 shadow-xl">
            {sidebar}
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
          <p className="text-sm font-semibold text-slate-500">
            Admin portal
          </p>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

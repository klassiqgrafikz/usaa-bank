import Link from "next/link";
import { Logo } from "@/components/logo";

const nav = [
  { href: "/insurance", label: "Insurance" },
  { href: "/banking", label: "Banking" },
  { href: "/investing", label: "Investing" },
  { href: "/investing", label: "Retirement" },
  { href: "/help", label: "Advice" },
  { href: "/help", label: "Help" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-semibold text-usaa-800 transition-colors hover:bg-usaa-50 hover:text-usaa-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-semibold text-slate-600 xl:block">
            1-800-531-USAA{" "}
            <span className="font-normal text-slate-400">
              (1-800-531-8722)
            </span>
          </span>
          <Link href="/signup" className="btn-secondary hidden sm:inline-flex">
            Open Account
          </Link>
          <Link href="/login" className="btn-primary">
            Log On
          </Link>
        </div>
      </div>
    </header>
  );
}

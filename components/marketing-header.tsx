import Link from "next/link";
import { Logo } from "@/components/logo";

const nav = [
  { href: "/banking", label: "Banking" },
  { href: "/insurance", label: "Insurance" },
  { href: "/investing", label: "Investing" },
  { href: "/help", label: "Help & Support" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-semibold text-usaa-800 transition-colors hover:bg-usaa-50 hover:text-usaa-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-medium text-slate-500 lg:block">
            For military what we do every member of the armed forces and their
            families
          </span>
          <button className="btn-primary hidden sm:inline-flex">Open Account</button>
          <Link href="/login" className="btn-primary">
            Sign On
          </Link>
        </div>
      </div>
      <div className="bg-usaa-800 px-4 py-1.5 text-center text-xs text-white">
        Demonstration environment — sample data only. Not affiliated with USAA.
      </div>
    </header>
  );
}
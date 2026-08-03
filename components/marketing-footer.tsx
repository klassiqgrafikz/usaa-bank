import Link from "next/link";
import { Logo } from "@/components/logo";

const columns = [
  {
    title: "Products",
    links: [
      { href: "/banking", label: "Banking" },
      { href: "/insurance", label: "Insurance" },
      { href: "/investing", label: "Investing" },
      { href: "/login", label: "Online banking" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/help", label: "Help center" },
      { href: "/help#faq", label: "FAQs" },
      { href: "/help#contact", label: "Contact us" },
      { href: "/login", label: "Find a branch/ATM" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/help", label: "About this demo" },
      { href: "/help", label: "Security & privacy" },
      { href: "/help", label: "Accessibility" },
      { href: "/help", label: "Careers" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="bg-usaa-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm text-slate-400">
              Insurance, banking, investments and retirement to help put
              members on a sound financial path.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-semibold text-white">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-slate-500">
          <p className="mb-2">
            This is a demonstration web application built for educational
            purposes. It is not operated by, endorsed by, or affiliated with
            USAA. All account data shown is fictional sample data.
          </p>
          <p>© {new Date().getFullYear()} USAA Demo Bank. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
import Link from "next/link";
import { Logo } from "@/components/logo";

const columns = [
  {
    title: "Products",
    links: [
      { href: "/insurance", label: "Insurance" },
      { href: "/banking", label: "Banking" },
      { href: "/investing", label: "Investments & retirement" },
      { href: "/login", label: "Online banking" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/help", label: "Help center" },
      { href: "/help", label: "ATMs & branches" },
      { href: "/help", label: "Send us a message" },
      { href: "/help", label: "Security center" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/help", label: "About us" },
      { href: "/help", label: "Careers" },
      { href: "/help", label: "Accessibility" },
      { href: "/help", label: "Terms & conditions" },
    ],
  },
];

const socials = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/usaa",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://twitter.com/usaa",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/usaa",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
      </svg>
    ),
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
            <div className="mt-4 flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {s.icon}
                </a>
              ))}
            </div>
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

        <div className="mt-10 grid gap-6 border-t border-white/10 pt-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-white">Contact us</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-400">
              <li>1-800-531-USAA (1-800-531-8722)</li>
              <li>210-531-USAA (210-531-8722)</li>
              <li>
                <Link href="/help" className="text-slate-300 hover:text-white">
                  Send us a message
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-wrap content-start items-start gap-x-5 gap-y-2 md:justify-end">
            <Link href="/help" className="text-xs text-slate-500 hover:text-white">
              Privacy promise
            </Link>
            <Link href="/help" className="text-xs text-slate-500 hover:text-white">
              Terms &amp; conditions
            </Link>
            <Link href="/help" className="text-xs text-slate-500 hover:text-white">
              Accessibility
            </Link>
            <Link href="/help" className="text-xs text-slate-500 hover:text-white">
              Site map
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-slate-500">
          <p className="mb-2">
            Insurance, banking and investments are available to members of the
            armed forces community and their families. Products and rates
            offered by USAA Federal Savings Bank and USAA affiliates.
          </p>
          <p>© {new Date().getFullYear()} USAA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

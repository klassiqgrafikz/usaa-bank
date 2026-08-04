import Link from "next/link";
import {
  ArrowRight,
  Landmark,
  LifeBuoy,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

const productColumns = [
  {
    title: "Insurance",
    icon: ShieldCheck,
    links: [
      "Auto insurance",
      "Home & condo",
      "Renters insurance",
      "Life insurance",
      "Umbrella",
    ],
  },
  {
    title: "Banking",
    icon: Landmark,
    links: ["Checking", "Savings", "Credit cards", "Auto loans", "Mortgages"],
  },
  {
    title: "Investments",
    icon: TrendingUp,
    links: ["Retirement", "Brokerage", "Managed portfolios", "Education savings"],
  },
  {
    title: "Military Life",
    icon: ShieldCheck,
    links: [
      "Deployment support",
      "Permanent change of station",
      "Leaving the military",
      "Financial readiness score",
    ],
  },
  {
    title: "Advice",
    icon: LifeBuoy,
    links: ["Budgeting", "Saving for goals", "Investing basics", "Insurance guidance"],
  },
  {
    title: "Additional Services",
    icon: LifeBuoy,
    links: ["Claims & roadside", "ATMs & branches", "Send us a message", "Security center"],
  },
];

const productHref: Record<string, string> = {
  "Auto insurance": "/insurance",
  "Home & condo": "/insurance",
  "Renters insurance": "/insurance",
  "Life insurance": "/insurance",
  Umbrella: "/insurance",
  Checking: "/login",
  Savings: "/login",
  "Credit cards": "/login",
  "Auto loans": "/login",
  Mortgages: "/login",
  Retirement: "/investing",
  Brokerage: "/investing",
  "Managed portfolios": "/investing",
  "Education savings": "/investing",
  "Deployment support": "/help",
  "Permanent change of station": "/help",
  "Leaving the military": "/help",
  "Financial readiness score": "/help",
  Budgeting: "/help",
  "Saving for goals": "/help",
  "Investing basics": "/help",
  "Insurance guidance": "/insurance",
  "Claims & roadside": "/help",
  "ATMs & branches": "/help",
  "Send us a message": "/help",
  "Security center": "/help",
};

const quickActions = [
  { label: "Claim status", href: "/help" },
  { label: "Find an ATM", href: "/help" },
  { label: "Contact us", href: "/help" },
  { label: "Site map", href: "/help" },
  { label: "Security", href: "/help" },
  { label: "Accessibility", href: "/help" },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-usaa-900 via-usaa-800 to-usaa-600 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-5 lg:py-24">
          <div className="lg:col-span-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-gold-400" />
              Insurance · Banking · Investments · Retirement
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
              Put your money on a solid path with USAA
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-200">
              We&apos;re here to help current and former military members and
              their families with checking, savings, insurance, credit and
              investing — in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn-primary text-base">
                Open an account
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                Sign on <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-8 text-xs text-slate-300">
              Membership is open to military members, veterans and their
              eligible family members.
            </p>
          </div>

          {/* Sign-on card */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-white p-6 text-usaa-900 shadow-2xl">
              <p className="text-lg font-extrabold">Member sign on</p>
              <div className="mt-4 space-y-3">
                <Link href="/login" className="btn-primary w-full">
                  Log On
                </Link>
                <Link href="/signup" className="btn-secondary w-full">
                  Become a member
                </Link>
              </div>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                <Link href="/forgot-password" className="link inline-block">
                  Forgot username or password?
                </Link>
                <p className="text-slate-500">
                  New to USAA?{" "}
                  <Link href="/signup" className="link">
                    Get started
                  </Link>
                </p>
                <p className="text-slate-500">
                  Need help?{" "}
                  <Link href="/help" className="link">
                    Contact us
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More USAA products and services */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold text-usaa-900">
          More USAA products and services
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          Explore everything USAA offers — designed around the needs of the
          military community.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productColumns.map((col) => (
            <div key={col.title} className="card p-6">
              <div className="flex items-center gap-2">
                <col.icon className="h-5 w-5 text-usaa-700" />
                <h3 className="text-lg font-bold text-usaa-900">{col.title}</h3>
              </div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      href={productHref[l] ?? "/help"}
                      className="group inline-flex items-center gap-1.5 text-sm text-slate-600 transition-colors hover:text-usaa-700"
                    >
                      {l}
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-usaa-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Feature strip */}
      <section className="bg-usaa-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                t: "Banking for military life",
                b: "Checking and savings with no monthly maintenance fees, plus credit cards and loans.",
              },
              {
                t: "Insurance that moves with you",
                b: "Auto, home, renters and life coverage built around deployments and PCS moves.",
              },
              {
                t: "Investing for every step",
                b: "Retirement plans, brokerage and managed portfolios at any experience level.",
              },
            ].map((f) => (
              <div key={f.t} className="rounded-xl border border-usaa-200 bg-white p-6">
                <h3 className="text-lg font-bold text-usaa-800">{f.t}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick action links */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold text-usaa-900">
          Quick action links
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {quickActions.map((qa) => (
            <Link
              key={qa.label}
              href={qa.href}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-usaa-800 transition-colors hover:border-usaa-400 hover:bg-usaa-50"
            >
              {qa.label}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-crimson-600 py-14">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold text-white">
            Ready to manage your money?
          </h2>
          <p className="mt-2 text-red-100">
            Open an account today — your checking, savings and card accounts
            are set up in seconds.
          </p>
          <Link href="/signup" className="btn-secondary mt-6 font-semibold">
            Create account
          </Link>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";

const perks = [
  { icon: "🛡️", title: "Banking", body: "Checking, savings, credit cards and loans with no monthly maintenance fees." },
  { icon: "🚗", title: "Insurance", body: "Auto, home, life and renters coverage built around military life." },
  { icon: "📈", title: "Investing", body: "Retirement plans, brokerage and managed portfolios for any experience level." },
];

const steps = [
  {
    n: "01",
    title: "Create a demo profile",
    body: "Sign up in under a minute and land on a fully populated sample account overview.",
  },
  {
    n: "02",
    title: "Explore the portal",
    body: "Move money, pay bills, send Zelle payments, deposit a check and download statements.",
  },
  {
    n: "03",
    title: "Reset anytime",
    body: "One click restores pristine sample data, so you can demo again and again.",
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-usaa-900 via-usaa-800 to-usaa-600 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-gold-400" />
              Online banking demo portal
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
              Put your money on a solid path with USAA<span className="text-crimson-500">.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-200">
              Explore a complete, functional online banking experience — checking,
              savings, credit, loans, transfers, bill pay, Zelle and more.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn-primary text-base">
                Open demo account
              </Link>
              <Link href="/login" className="rounded-md bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20">
                Sign on →
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-300">
              Simulated banking for educational purposes. Not real money.
            </p>
          </div>
          <div className="relative hidden lg:block">
            <div className="rounded-xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-usaa-800">Good morning</p>
                  <p className="text-lg font-bold text-slate-900">Alex R.</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Net worth +12.4%
                </span>
              </div>
              <div className="mt-4 flex gap-3">
                <div className="flex-1 rounded-lg bg-usaa-50 p-4">
                  <p className="text-xs text-slate-500">Total balance</p>
                  <p className="text-2xl font-bold text-usaa-800">$94,281.20</p>
                </div>
                <div className="flex-1 rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Available</p>
                  <p className="text-2xl font-bold text-slate-900">$86,421.12</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="flex-1 rounded-md bg-crimson-600 py-2 text-center text-sm font-semibold text-white">Transfer</span>
                <span className="flex-1 rounded-md bg-crimson-600 py-2 text-center text-sm font-semibold text-white">Pay bills</span>
              </div>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {["Secure Checking · $8,458.05", "Performance First Savings · $24,830.00", "Rewards Visa · $2,859.67 available"].map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{r.split(" · ")[0]}</span>
                    <span className="font-semibold text-slate-900">{r.split(" · ")[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold text-usaa-900">
          One destination for your financial life
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          Everything you need in one place, backed by a desktop-grade online
          portal and sample data you can reset anytime.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {perks.map((p) => (
            <div key={p.title} className="card p-6 text-center">
              <div className="text-4xl">{p.icon}</div>
              <h3 className="mt-3 text-lg font-bold text-usaa-900">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{p.body}</p>
              <Link href="/login" className="link mt-4 inline-block text-sm">
                Explore {p.title.toLowerCase()}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Feature strip */}
      <section className="bg-usaa-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { t: "24/7 access", b: "Your accounts, activity and statements whenever you need them." },
              { t: "Fee-friendly", b: "No monthly maintenance fees. Edge at the counter." },
              { t: "Smarter money moves", b: "Transfers, bill pay and Zelle in just a few clicks." },
            ].map((f) => (
              <div key={f.t} className="rounded-xl border border-usaa-200 bg-white p-6">
                <h3 className="text-lg font-bold text-usaa-800">{f.t}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold text-usaa-900">
          Get started in 3 steps
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-xl border border-slate-200 p-6">
              <span className="text-4xl font-extrabold text-usaa-100">{s.n}</span>
              <h3 className="mt-2 text-lg font-bold text-usaa-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-crimson-600 py-14">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold text-white">
            Ready to explore the portal?
          </h2>
          <p className="mt-2 text-red-100">
            Create your demo account — fully seeded with sample data in seconds.
          </p>
          <Link href="/signup" className="btn-secondary mt-6 font-semibold">
            Create account
          </Link>
        </div>
      </section>
    </div>
  );
}
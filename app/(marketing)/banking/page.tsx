import { ProductHero, FeatureGrid, CtaBand, type ProductFeature } from "@/components/product-ui";

const features: ProductFeature[] = [
  { icon: "💳", title: "Secure Checking", body: "No monthly maintenance fees, ATM fee refunds and early access to direct deposits." },
  { icon: "🏦", title: "Performance Savings", body: "Earn a top-tier APY on every dollar with automatic savings tools." },
  { icon: "💎", title: "Rewards Visa", body: "Cash back and points that never expire, with no annual fee." },
  { icon: "🚘", title: "Auto & Personal Loans", body: "Competitive rates and flexible terms, with payoff tracking in the portal." },
  { icon: "📱", title: "Mobile check deposit", body: "Snap a photo and deposit a check securely, right from the app." },
  { icon: "↔️", title: "Transfers & Zelle", body: "Move money between accounts, to external banks, or send to friends." },
];

export default function BankingPage() {
  return (
    <div>
      <ProductHero
        eyebrow="Banking"
        title="Banking that keeps pace with your life"
        subtitle="A full-service checking and savings experience, credit cards, loans and tools to automate the heavy lifting."
        cta="Sign on to banking"
      />
      <FeatureGrid features={features} />
      <section className="bg-usaa-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-usaa-900">Everyday banking without the fuss</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-usaa-200 bg-white p-6 text-center">
              <p className="text-4xl font-extrabold text-usaa-800">0</p>
              <p className="mt-1 text-sm font-medium text-slate-600">monthly maintenance fees</p>
            </div>
            <div className="rounded-xl border border-usaa-200 bg-white p-6 text-center">
              <p className="text-4xl font-extrabold text-usaa-800">70,000+</p>
              <p className="mt-1 text-sm font-medium text-slate-600">fee-free ATMs</p>
            </div>
            <div className="rounded-xl border border-usaa-200 bg-white p-6 text-center">
              <p className="text-4xl font-extrabold text-usaa-800">24/7</p>
              <p className="mt-1 text-sm font-medium text-slate-600">member support</p>
            </div>
          </div>
        </div>
      </section>
      <CtaBand
        title="Move to a demo account with everything set up"
        body="Your portal arrives pre-loaded with accounts, transactions, payees and contacts."
      />
    </div>
  );
}
import Link from "next/link";
import { ProductHero } from "@/components/product-ui";

const faqs = [
  {
    q: "Is this a real bank account?",
    a: "No. This is a demonstration portal with sample data. Nothing on this site is real money, and there is no real USAA integration.",
  },
  {
    q: "How do I see the app?",
    a: "Create an account from the sign-up page. Your demo data (accounts, transactions, payees, Zelle contacts) is generated automatically.",
  },
  {
    q: "Can I reset the sample data?",
    a: "Yes. Inside the portal, open Security then click “Reset demo data” to wipe and regenerate your sample accounts.",
  },
  {
    q: "What banking features are simulated?",
    a: "Login with two-step verification, dashboard, account detail, transactions with search/download, internal + external + wire transfers, bill pay, Zelle, mobile deposit, statements, cards, alerts and profile.",
  },
  {
    q: "Do I need a Supabase account?",
    a: "To run this yourself, yes — the app reads from a Supabase project. See the README for one-time setup instructions.",
  },
  {
    q: "Why does the two-step code appear on screen?",
    a: "No email/SMS provider is attached to the demo, so the generated verification code is displayed inline for you to complete the flow.",
  },
];

export default function HelpPage() {
  return (
    <div id="faq">
      <ProductHero
        eyebrow="Help & Support"
        title="How can we help you?"
        subtitle="Answers about the demo portal, or get in touch — we reply to everything."
        cta="Explore the portal"
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-extrabold text-usaa-900">Frequently asked questions</h2>
        <div className="mt-8 space-y-4">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-lg border border-slate-200 bg-white p-5 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-usaa-900">
                {f.q}
                <span className="text-slate-400 transition-transform group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>

        <div id="contact" className="mt-12 rounded-xl bg-usaa-50 p-8">
          <h2 className="text-xl font-bold text-usaa-900">Still need a hand?</h2>
          <p className="mt-2 text-sm text-slate-600">
            Our (simulated) team monitors this inbox during business hours.
          </p>
          <form className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" className="input" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" placeholder="you@example.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="msg">How can we help?</label>
              <textarea id="msg" name="msg" rows={4} className="input" placeholder="Tell us what's on your mind…" />
            </div>
            <div className="sm:col-span-2">
              <Link href="/login" className="btn-primary w-full sm:w-auto">
                Send (demo)
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
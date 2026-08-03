import Link from "next/link";
import { ProductHero } from "@/components/product-ui";

const faqs = [
  {
    q: "How do I open an account?",
    a: "Sign up from the home page with your name and email. Your checking, savings, credit card and investment accounts are created automatically, and you confirm your email to start.",
  },
  {
    q: "Why do I enter a verification code every time I sign on?",
    a: "Two-step verification is enabled for every account. After you enter your password, we send a 6-digit code to the email on your account to confirm it's really you.",
  },
  {
    q: "What can I do in the online portal?",
    a: "Dashboard and account overviews, transactions with search and download, internal, external and wire transfers, bill pay, Zelle, mobile check deposit, statements, card management, alerts and your profile.",
  },
  {
    q: "How do I reset my password?",
    a: "Choose \"Forgot username or password\" on the sign-on page and enter your email. We'll send you a secure link to choose a new password.",
  },
  {
    q: "Are there monthly maintenance fees?",
    a: "No. Checking, savings and credit accounts have no monthly maintenance fees, and you can keep everything — banking, insurance and investments — in one place.",
  },
  {
    q: "Is my data secure?",
    a: "Your data is protected with encrypted connections and row-level access controls so only you can see your own accounts. Two-step verification is turned on for every sign-on.",
  },
];

export default function HelpPage() {
  return (
    <div id="faq">
      <ProductHero
        eyebrow="Help & Support"
        title="How can we help you?"
        subtitle="Answers about online banking, security and account setup — or get in touch and we'll point you in the right direction."
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
            Our support team monitors this inbox during business hours and
            replies to every message.
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
                Send message
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
import Link from "next/link";
import { PageHeader } from "@/components/banking/page-header";

const topics = [
  {
    title: "Transfers",
    items: [
      "How do I move money between my accounts?",
      "How long do external transfers take?",
      "What is a wire transfer?",
    ],
  },
  {
    title: "Payments",
    items: [
      "How do I add a bill payee?",
      "How does Zelle work?",
      "What does a pending transaction mean?",
    ],
  },
  {
    title: "Accounts & cards",
    items: [
      "How do I lock my card?",
      "How do I dispute a charge?",
      "How do I see my routing number?",
    ],
  },
  {
    title: "Security",
    items: [
      "Why do I always enter a verification code?",
      "How do I reset my password?",
      "How do I reset my demo data?",
    ],
  },
];

export default function BankHelpPage() {
  return (
    <>
      <PageHeader title="Help center" subtitle="Find quick answers for the demo banking portal." />

      <div className="grid gap-6 md:grid-cols-2">
        {topics.map((t) => (
          <div key={t.title} className="card p-6">
            <h2 className="font-bold text-usaa-900">{t.title}</h2>
            <ul className="mt-4 space-y-2">
              {t.items.map((q) => (
                <li key={q} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-usaa-400" />
                  <span className="cursor-pointer hover:text-usaa-700 hover:underline">{q}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-bold text-usaa-900">Still need help?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Contact our simulated support line or browse the general help pages.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/help" className="btn-primary">
            Public help center
          </Link>
          <Link href="/login" className="btn-secondary">
            Call 800-555-0100
          </Link>
        </div>
      </div>
    </>
  );
}
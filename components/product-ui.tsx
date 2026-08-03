import Link from "next/link";

export interface ProductFeature {
  title: string;
  body: string;
  icon: string;
}

export function ProductHero({
  eyebrow,
  title,
  subtitle,
  cta,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
}) {
  return (
    <section className="bg-gradient-to-br from-usaa-900 via-usaa-800 to-usaa-600 text-white">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold-400">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-200">{subtitle}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="btn-primary">
            {cta}
          </Link>
          <Link href="/help" className="btn-secondary bg-white/10 text-white hover:bg-white/20">
            Talk to us
          </Link>
        </div>
      </div>
    </section>
  );
}

export function FeatureGrid({
  features,
}: {
  features: ProductFeature[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="group card p-6 transition-shadow hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-usaa-50 text-2xl">
              {f.icon}
            </div>
            <h3 className="mt-4 text-lg font-bold text-usaa-900">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CtaBand({ title, body }: { title: string; body: string }) {
  return (
    <section className="bg-crimson-600">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 sm:px-6 md:flex-row">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1 text-sm text-red-100">{body}</p>
        </div>
        <Link href="/signup" className="btn-secondary font-semibold">
          Open an account
        </Link>
      </div>
    </section>
  );
}
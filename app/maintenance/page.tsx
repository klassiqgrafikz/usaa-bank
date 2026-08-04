export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-usaa-950 px-6">
      <div className="w-full max-w-md text-center">
        <img
          src="/images/usaa-logo.svg"
          alt=""
          aria-hidden="true"
          className="mx-auto h-14 w-auto brightness-0 invert"
        />
        <h1 className="mt-8 text-xl font-extrabold text-white sm:text-2xl">
          Error occurred, try again later
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          We&apos;re unable to complete your request right now. Our systems are
          temporarily unavailable. Please try again in a few minutes.
        </p>
      </div>
    </main>
  );
}

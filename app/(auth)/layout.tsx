import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-usaa-900 via-usaa-800 to-usaa-600">
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-4 pt-6">
        <Logo light />
        <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white">
          Back to home
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white p-8 shadow-2xl">{children}</div>
          <p className="mt-4 text-center text-xs text-slate-300">
            Secure online banking — protected by two-step verification on
            every sign-on.
          </p>
        </div>
      </main>
    </div>
  );
}
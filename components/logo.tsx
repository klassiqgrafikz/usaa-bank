import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 44 44" className="h-9 w-9" aria-hidden="true">
        <defs>
          <linearGradient id="usaa-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1d4f91" />
            <stop offset="100%" stopColor="#0b2342" />
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="10" fill="url(#usaa-g)" />
        <path
          d="M22 6c-4.4 0-8.5 1.2-12 3.3v6.7c0 9.9 4.5 17.4 12 21 7.5-3.6 12-11.1 12-21v-6.7C30.5 7.2 26.4 6 22 6zm-2.6 21.4l-4.3-4.3 1.8-1.8 2.5 2.5 5.7-5.7 1.8 1.8-7.5 7.5z"
          fill="#fff"
        />
        <path
          d="M22 5l7.5 7.5-1.8 1.8L22 8.6l-5.7 5.7-1.8-1.8L22 5z"
          fill="#f0ab00"
          opacity="0.9"
        />
      </svg>
      <span
        className={cn(
          "text-2xl font-extrabold tracking-tight",
          light ? "text-white" : "text-usaa-800",
        )}
      >
        USAA<span className="text-crimson-600">.</span>
      </span>
    </Link>
  );
}
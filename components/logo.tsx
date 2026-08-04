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
      <img
        src="/images/usaa-logo.svg"
        alt=""
        aria-hidden="true"
        className={cn(
          "h-9 w-auto",
          light && "brightness-0 invert",
        )}
      />
      <span
        className={cn(
          "text-2xl font-extrabold tracking-tight",
          light ? "text-white" : "text-usaa-800",
        )}
      >
        USAA
      </span>
    </Link>
  );
}

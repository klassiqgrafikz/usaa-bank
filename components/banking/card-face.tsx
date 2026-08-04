import { cn } from "@/lib/utils";
import type { Card } from "@/lib/types";

function formatCardNumber(num: string) {
  return num
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function NetworkLogo({
  brand,
  className,
}: {
  brand: string;
  className?: string;
}) {
  if (brand === "Mastercard") {
    return (
      <span
        className={cn("relative inline-flex h-7 w-9 shrink-0", className)}
        aria-label="Mastercard"
      >
        <span className="absolute left-0 h-7 w-7 rounded-full bg-[#EB001B]" />
        <span className="absolute left-3 h-7 w-7 rounded-full bg-[#F79E1B] mix-blend-multiply" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "shrink-0 text-lg font-extrabold italic tracking-tight text-white",
        className,
      )}
    >
      VISA
    </span>
  );
}

export function CardFace({
  card,
  revealed,
}: {
  card: Card;
  revealed: boolean;
}) {
  const frozen = card.status === "frozen";
  const number = card.card_number ?? "";
  const maskedNumber = `•••• •••• •••• ${card.card_last4}`;
  const fullNumber = number ? formatCardNumber(number) : maskedNumber;

  return (
    <div className="relative h-60 w-full sm:h-56">
      <div
        className={cn(
          "relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]",
          revealed && "[transform:rotateY(180deg)]",
          frozen && "opacity-60 grayscale",
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-usaa-800 to-usaa-950 p-5 text-white shadow-lg [backface-visibility:hidden]">
          <div className="flex items-start justify-between">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {card.card_type === "virtual" ? "Virtual" : card.card_type}
            </span>
            <NetworkLogo brand={card.brand} />
          </div>

          <div className="mt-6 flex items-center gap-2">
            <div className="relative h-8 w-11 overflow-hidden rounded-md bg-gradient-to-br from-gold-400 to-gold-500">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/30" />
              <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/30" />
            </div>
            {card.card_type === "virtual" && (
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                Virtual card
              </span>
            )}
          </div>

          <p className="mt-5 font-mono text-lg tracking-[0.12em] text-slate-100">
            {revealed ? fullNumber : maskedNumber}
          </p>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
            <span>Member</span>
            <span>Exp {card.expires}</span>
          </div>

          {frozen && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/40">
              <span className="rounded-full bg-slate-800/80 px-5 py-2 text-sm font-bold uppercase tracking-widest text-white shadow">
                Frozen
              </span>
            </div>
          )}
        </div>

        {/* Back */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-usaa-800 to-usaa-950 p-5 text-white shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="h-10 w-full rounded bg-slate-950/70" />

          <div className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Card number
              </span>
              <span className="font-mono text-sm text-slate-100">
                {revealed ? fullNumber : maskedNumber}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Expires
              </span>
              <span className="font-mono text-sm text-slate-100">{card.expires}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                CVV
              </span>
              <span className="font-mono text-sm text-slate-100">
                {revealed ? (card.cvv ?? "•••") : "•••"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs text-slate-400">
              {card.brand} · {card.card_type}
            </span>
            <NetworkLogo brand={card.brand} className="opacity-90" />
          </div>

          {frozen && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/40">
              <span className="rounded-full bg-slate-800/80 px-5 py-2 text-sm font-bold uppercase tracking-widest text-white shadow">
                Frozen
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useBankData } from "@/lib/use-bank-data";
import { CardsClient } from "./cards-client";
import { isMockMode } from "@/lib/mock";

export default function CardsPage() {
  const { data, error, reload } = useBankData(async (api) => {
    const [cards, disputes] = await Promise.all([
      api.getCards(),
      api.getDisputes(),
    ]);
    return { cards, disputes };
  }, [isMockMode()]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) {
    return <p className="text-sm text-slate-400">Loading cards…</p>;
  }

  return (
    <CardsClient cards={data.cards} disputes={data.disputes} onChanged={reload} />
  );
}
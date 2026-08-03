import {
  ProductHero,
  FeatureGrid,
  CtaBand,
  type ProductFeature,
} from "@/components/product-ui";

const features: ProductFeature[] = [
  { icon: "🌅", title: "Retirement funds", body: "Target-date and managed funds designed to keep pace through every chapter." },
  { icon: "📊", title: "Brokerage & robo advisory", body: "Trade stocks and ETFs yourself, or let a digital advisor build the mix." },
  { icon: "💰", title: "Auto-investing", body: "Round up spare change or schedule deposits straight from your checking account." },
  { icon: "🏛️", title: "IRAs & 401(k) rollovers", body: "Consolidate your retirement money and reduce fees with one clear picture." },
  { icon: "🧭", title: "Portfolio insights", body: "A live view of holdings, returns and asset allocation right in the portal." },
  { icon: "🔎", title: "Net worth tracker", body: "See your entire financial picture updated in near real time." },
];

export default function InvestingPage() {
  return (
    <div>
      <ProductHero
        eyebrow="Investing & Retirement"
        title="Invest for the life you want next"
        subtitle="Retirement funds, brokerage accounts and a net worth view that keeps you on path."
        cta="View a portfolio"
      />
      <FeatureGrid features={features} />
      <CtaBand
        title="Bring investing into one dashboard"
        body="Holdings, balances and performance all visible beside your banking."
      />
    </div>
  );
}
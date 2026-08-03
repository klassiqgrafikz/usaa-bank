import {
  ProductHero,
  FeatureGrid,
  CtaBand,
  type ProductFeature,
} from "@/components/product-ui";

const features: ProductFeature[] = [
  { icon: "🚗", title: "Auto insurance", body: "Protect your ride with flexible deductibles, accident forgiveness and roadside help." },
  { icon: "🏠", title: "Homeowners & renters", body: "Coverage for your home and belongings, from basics to full replacement value." },
  { icon: "🛳️", title: "Valuable property", body: "Protect watches, jewelry, cameras and more wherever you take them." },
  { icon: "👨‍👩‍👧", title: "Life insurance", body: "Term and permanent options sized for whatever stage of life you are in." },
  { icon: "☂️", title: "Umbrella", body: "Extra liability protection above your auto and home limits." },
  { icon: "📞", title: "Claims team", body: "File and track claims right from the portal, any time of day." },
];

export default function InsurancePage() {
  return (
    <div>
      <ProductHero
        eyebrow="Insurance"
        title="Insurance that follows you from base to deployment"
        subtitle="From your first year of service onward, find coverage rates that move with your needs."
        cta="Get a quote"
      />
      <FeatureGrid features={features} />
      <CtaBand
        title="Explore the insurance experience"
        body="Track auto, home and life coverage inside the banking portal."
      />
    </div>
  );
}
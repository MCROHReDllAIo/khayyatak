import type { PricingInput, PricingRecommendation } from "@/types";

export function recommendPrice(input: PricingInput): PricingRecommendation {
  const laborCost = input.labor_hours * input.labor_rate;
  const totalCost =
    input.fabric_cost +
    laborCost +
    input.embroidery_cost +
    input.accessories_cost;
  const profitMultiplier = 1 + input.desired_profit_percent / 100;
  const recommended = totalCost * profitMultiplier;
  const margin = ((recommended - totalCost) / recommended) * 100;

  const marketMin = recommended * 0.85;
  const marketMax = recommended * 1.2;

  return {
    recommended_price: Math.round(recommended * 10) / 10,
    estimated_margin: Math.round(margin),
    market_min: Math.round(marketMin * 10) / 10,
    market_max: Math.round(marketMax * 10) / 10,
    reason_ar:
      "السعر المقترح مناسب لتكلفة الإنتاج والأسعار المشابهة في منطقتك.",
    reason_en:
      "Recommended price aligns with production costs and similar prices in your area.",
  };
}

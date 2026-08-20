import type { DesignConfig, Measurements, Profile } from "@/types";

export interface TailorSpecification {
  id: string;
  customerName: string;
  customerCity?: string;
  garment: DesignConfig;
  measurements?: Measurements;
  notes: string[];
  budget?: string;
  deliveryDays: number;
  referenceImages: number;
  createdAt: string;
}

export function generateTailorSpecification(
  profile: Profile | null,
  design: DesignConfig,
  measurements: Measurements | null,
  tailorName?: string,
  deliveryDays = 3
): TailorSpecification {
  const notes: string[] = [
    `نوع القطعة: ${design.garmentType === "abaya" ? "عباية" : "دشداشة عمانية"}`,
    `اللون: ${design.color} | القماش: ${design.fabric}`,
    `القصة/الياقة: ${design.collar} | التطريز: ${design.embroidery}`,
  ];
  if (tailorName) notes.push(`الخياط المختار: ${tailorName}`);
  if (measurements?.is_ai_estimate) {
    notes.push("⚠️ القياسات تقديرية AI — يُرجى التأكيد قبل القص");
  }

  return {
    id: `spec-${Date.now()}`,
    customerName: profile?.full_name_ar ?? "عميل",
    customerCity: profile?.city,
    garment: design,
    measurements: measurements ?? undefined,
    notes,
    budget: "15–25 ر.ع",
    deliveryDays,
    referenceImages: 0,
    createdAt: new Date().toISOString(),
  };
}

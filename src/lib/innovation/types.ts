import type { DesignConfig } from "@/types";

export type InnovationRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "VIEWED"
  | "IN_REVIEW"
  | "NEEDS_CHANGES"
  | "FEASIBLE"
  | "NOT_FEASIBLE"
  | "ACCEPTED"
  | "ORDER_CREATED"
  | "CANCELLED";

export type FeasibilityDecision = "FEASIBLE" | "NEEDS_CHANGES" | "NOT_FEASIBLE";

export type MaterialAvailability = "available" | "close_match" | "unavailable" | "unknown";

export interface InnovationDesignSpec {
  category: "abaya" | "dishdasha";
  color: string;
  colorKey: string;
  colorHex?: string;
  fabric: string;
  fabricKey: string;
  opening?: string;
  openingKey?: string;
  fit?: string;
  fitKey?: string;
  sleeves?: string;
  sleevesKey?: string;
  length?: string;
  lengthKey?: string;
  embroidery?: string;
  embroideryKey?: string;
  occasion?: string;
  lining?: string;
  buttons?: string;
  customerNotes?: string;
  aiNotes?: string;
}

export interface InnovationSession {
  id: string;
  customer_id: string;
  title: string;
  status: string;
  current_version: number;
  design_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomDesignVersion {
  id: string;
  design_id: string;
  version_number: number;
  spec: InnovationDesignSpec;
  design_config: DesignConfig;
  change_summary_ar?: string;
  change_summary_en?: string;
  reference_images: string[];
  ai_visualization_url?: string;
  created_at: string;
}

export interface MaterialCheckResult {
  tailor_id: string;
  tailor_name_ar: string;
  material_name: string;
  color_hex?: string;
  availability: MaterialAvailability;
  quantity?: number;
  inventory_id?: string;
  notes?: string;
}

export interface CustomDesignRequest {
  id: string;
  customer_id: string;
  store_id: string;
  design_id: string;
  design_version_id: string;
  measurement_id?: string;
  specification: Record<string, unknown>;
  status: InnovationRequestStatus;
  complexity_estimate?: string;
  ai_tailor_summary?: string;
  store_name_ar?: string;
  customer_name?: string;
  created_at: string;
  updated_at: string;
  version?: CustomDesignVersion;
  review?: FeasibilityReview;
}

export interface FeasibilityReview {
  id: string;
  request_id: string;
  tailor_id: string;
  decision: FeasibilityDecision;
  estimated_price?: number;
  estimated_delivery_days?: number;
  tailor_notes_ar?: string;
  tailor_notes_en?: string;
  suggested_changes?: string[];
  reviewed_at: string;
}

export const DEFAULT_INNOVATION_SPEC: InnovationDesignSpec = {
  category: "abaya",
  color: "أسود",
  colorKey: "black",
  colorHex: "#1a1a1a",
  fabric: "كريب",
  fabricKey: "crepe",
  opening: "مفتوحة",
  openingKey: "front_open",
  fit: "مريحة",
  fitKey: "relaxed",
  sleeves: "واسعة",
  sleevesKey: "wide",
  length: "كاملة",
  lengthKey: "full_length",
  embroidery: "بدون",
  embroideryKey: "none",
  occasion: "يومي",
};

export function specToDesignConfig(spec: InnovationDesignSpec): DesignConfig {
  return {
    garmentType: spec.category,
    color: spec.color,
    colorKey: spec.colorKey,
    fabric: spec.fabric,
    fabricKey: spec.fabricKey,
    collar: spec.opening ?? "—",
    collarKey: spec.openingKey ?? "classic",
    embroidery: spec.embroidery ?? "بدون",
    embroideryKey: spec.embroideryKey ?? "none",
    fit: spec.fit,
    fitKey: spec.fitKey,
    sleeves: spec.sleeves,
    sleevesKey: spec.sleevesKey,
    length: spec.length,
    lengthKey: spec.lengthKey,
    buttons: spec.buttons,
    name: `${spec.color} ${spec.category === "abaya" ? "عباية" : "دشداشة"}`,
  };
}

export function buildExecutionSpecification(
  spec: InnovationDesignSpec,
  version: number,
  referenceImages: string[]
): Record<string, unknown> {
  return {
    version,
    garment: spec.category === "abaya" ? "عباية" : "دشداشة",
    color: spec.color,
    color_hex: spec.colorHex,
    fabric: spec.fabric,
    cut: spec.fit,
    opening: spec.opening,
    sleeves: spec.sleeves,
    length: spec.length,
    embroidery: spec.embroidery,
    lining: spec.lining,
    buttons: spec.buttons,
    occasion: spec.occasion,
    customer_notes: spec.customerNotes,
    ai_suggestions: spec.aiNotes,
    reference_images: referenceImages,
    generated_at: new Date().toISOString(),
  };
}

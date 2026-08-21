/**
 * Calibrated body measurement estimation for Omani tailoring.
 * Scale comes from user-confirmed height (cm) — same principle as AR world-scale.
 * Optional vision refines build; never invents random demo numbers.
 */

import type { Measurements } from "@/types";
import { callLLMWithVision, extractJsonFromLLM, isRealAIProvider } from "@/lib/ai/provider";

export type BodyBuild = "slim" | "regular" | "broad";
export type BodySex = "male" | "female" | "unspecified";

export interface MeasurementScanStep {
  id: string;
  label_ar: string;
  label_en: string;
}

export const SCAN_STEPS: MeasurementScanStep[] = [
  { id: "calibrate", label_ar: "معايرة بالطول الحقيقي...", label_en: "Calibrating to your height..." },
  { id: "pose", label_ar: "قراءة نسب الجسم من الصورة", label_en: "Reading body proportions from photo" },
  { id: "estimate", label_ar: "حساب مقاسات التفصيل", label_en: "Computing tailoring measurements" },
  { id: "done", label_ar: "جاهز للمراجعة", label_en: "Ready for review" },
];

export interface EstimateInput {
  /** Required known height in cm — the accuracy anchor */
  heightCm: number;
  weightKg?: number;
  sex?: BodySex;
  /** data URL or https image */
  imageDataUrl?: string;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function bmiOf(heightCm: number, weightKg?: number): number | null {
  if (!weightKg || weightKg < 30 || weightKg > 250) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

function buildFromBmi(bmi: number | null, sex: BodySex): BodyBuild {
  if (bmi == null) return "regular";
  if (sex === "female") {
    if (bmi < 19.5) return "slim";
    if (bmi > 26) return "broad";
    return "regular";
  }
  if (bmi < 20) return "slim";
  if (bmi > 27) return "broad";
  return "regular";
}

/**
 * Deterministic anthropometric estimates from calibrated height.
 * Ratios tuned for dishdasha / abaya tailoring (cm).
 */
export function estimateFromCalibration(input: EstimateInput): Measurements {
  const height = clamp(Math.round(input.heightCm), 140, 210);
  const sex = input.sex ?? "unspecified";
  const bmi = bmiOf(height, input.weightKg);
  const build = buildFromBmi(bmi, sex);

  const chestFactor =
    sex === "female"
      ? build === "slim"
        ? 0.52
        : build === "broad"
          ? 0.58
          : 0.545
      : build === "slim"
        ? 0.54
        : build === "broad"
          ? 0.6
          : 0.565;

  const waistFactor =
    sex === "female"
      ? build === "slim"
        ? 0.42
        : build === "broad"
          ? 0.5
          : 0.45
      : build === "slim"
        ? 0.46
        : build === "broad"
          ? 0.54
          : 0.49;

  const chest = round1(height * chestFactor);
  const waist = round1(height * waistFactor);
  const shoulder = round1(height * (sex === "female" ? 0.23 : 0.255));
  const sleeve = round1(height * 0.33);
  const dishdasha_length = round1(height * (sex === "female" ? 0.85 : 0.81));

  let confidence = 78;
  if (input.weightKg) confidence += 8;
  if (sex !== "unspecified") confidence += 4;
  confidence = clamp(confidence, 70, 92);

  return {
    height,
    chest,
    waist,
    shoulder,
    sleeve,
    dishdasha_length,
    confidence,
    is_ai_estimate: true,
  };
}

interface VisionRefine {
  build?: BodyBuild;
  posture_ok?: boolean;
  chest_delta_cm?: number;
  waist_delta_cm?: number;
  shoulder_delta_cm?: number;
  notes_ar?: string;
}

async function refineWithVision(
  base: Measurements,
  imageDataUrl: string,
  sex: BodySex
): Promise<{ measurements: Measurements; usedVision: boolean; notes_ar?: string }> {
  const system = `You are a careful fashion measurement assistant for Omani garments (dishdasha/abaya).
The person already provided accurate height in cm. Do NOT invent absolute height.
From the photo, judge body build and suggest small cm adjustments only (±0 to ±6).
Return ONLY JSON:
{"build":"slim|regular|broad","posture_ok":true,"chest_delta_cm":0,"waist_delta_cm":0,"shoulder_delta_cm":0,"notes_ar":"short Arabic note"}
If the photo is not a standing full/upper body person, set deltas to 0 and posture_ok false.`;

  const result = await callLLMWithVision(
    system,
    `Height (confirmed): ${base.height} cm. Sex hint: ${sex}. Suggest relative adjustments only.`,
    imageDataUrl
  );

  if (!result.content || !isRealAIProvider(result.provider)) {
    return { measurements: base, usedVision: false };
  }

  const parsed = extractJsonFromLLM<VisionRefine>(result.content);
  if (!parsed) {
    return { measurements: { ...base, confidence: Math.min(base.confidence, 80) }, usedVision: false };
  }

  const chest = round1(clamp(base.chest + (parsed.chest_delta_cm ?? 0), base.height * 0.45, base.height * 0.7));
  const waist = round1(clamp(base.waist + (parsed.waist_delta_cm ?? 0), base.height * 0.35, base.height * 0.65));
  const shoulder = round1(
    clamp(base.shoulder + (parsed.shoulder_delta_cm ?? 0), base.height * 0.18, base.height * 0.32)
  );

  let confidence = base.confidence + (parsed.posture_ok ? 8 : -6);
  confidence = clamp(confidence, 65, 96);

  return {
    measurements: {
      ...base,
      chest,
      waist,
      shoulder,
      confidence,
      is_ai_estimate: true,
    },
    usedVision: true,
    notes_ar: parsed.notes_ar,
  };
}

export async function estimateMeasurements(input: EstimateInput): Promise<{
  measurements: Measurements;
  usedVision: boolean;
  method: "calibrated" | "calibrated+vision";
  notes_ar?: string;
}> {
  if (!Number.isFinite(input.heightCm) || input.heightCm < 140 || input.heightCm > 210) {
    throw new Error("HEIGHT_REQUIRED");
  }

  const base = estimateFromCalibration(input);
  if (!input.imageDataUrl) {
    return { measurements: base, usedVision: false, method: "calibrated" };
  }

  const refined = await refineWithVision(base, input.imageDataUrl, input.sex ?? "unspecified");
  return {
    measurements: refined.measurements,
    usedVision: refined.usedVision,
    method: refined.usedVision ? "calibrated+vision" : "calibrated",
    notes_ar: refined.notes_ar,
  };
}

/** @deprecated use estimateMeasurements with height calibration */
export async function runMeasurementScan(
  onStep: (step: MeasurementScanStep) => void,
  input?: EstimateInput
): Promise<Measurements> {
  for (const step of SCAN_STEPS) {
    onStep(step);
    await new Promise((r) => setTimeout(r, step.id === "estimate" ? 500 : 350));
  }
  const heightCm = input?.heightCm ?? 173;
  const result = await estimateMeasurements({ ...input, heightCm });
  return result.measurements;
}

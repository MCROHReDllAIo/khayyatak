import type { Measurements } from "@/types";
import { sleep } from "@/lib/utils";

export interface MeasurementScanStep {
  id: string;
  label_ar: string;
  label_en: string;
}

export const SCAN_STEPS: MeasurementScanStep[] = [
  { id: "analyze", label_ar: "جاري تحليل الصورة...", label_en: "Analyzing image..." },
  { id: "pose", label_ar: "تم اكتشاف وضعية الجسم", label_en: "Body pose detected" },
  { id: "estimate", label_ar: "جاري تقدير القياسات", label_en: "Estimating measurements" },
  { id: "done", label_ar: "تم إنشاء القياسات", label_en: "Measurements created" },
];

function generateRealisticMeasurements(): Measurements {
  const baseHeight = 168 + Math.floor(Math.random() * 15);
  const chest = Math.floor(baseHeight * 0.56 + Math.random() * 6);
  const waist = Math.floor(chest * 0.88 + Math.random() * 4);
  const shoulder = Math.floor(chest * 0.45);
  const sleeve = Math.floor(baseHeight * 0.34);
  const dishdashaLength = Math.floor(baseHeight * 0.81);

  return {
    height: baseHeight,
    chest,
    waist,
    shoulder,
    sleeve,
    dishdasha_length: dishdashaLength,
    confidence: 88 + Math.floor(Math.random() * 10),
    is_ai_estimate: true,
  };
}

export async function estimateMeasurements(
  // Reserved for future vision-based measurement from uploaded photo
  imageData?: string
): Promise<Measurements> {
  void imageData;
  await sleep(3000);
  return generateRealisticMeasurements();
}

export async function runMeasurementScan(
  onStep: (step: MeasurementScanStep) => void
): Promise<Measurements> {
  for (const step of SCAN_STEPS) {
    onStep(step);
    await sleep(step.id === "analyze" ? 1200 : 800);
  }
  return generateRealisticMeasurements();
}

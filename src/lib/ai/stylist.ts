import type { StyleRecommendation } from "@/types";
import { callLLMFromClient, extractJsonFromLLM, isRealAIProvider } from "./provider";

function mockStyleRecommendation(prompt: string): StyleRecommendation {
  const lower = prompt.toLowerCase();
  let colorKey = "white";
  let color = "أبيض";
  let fabricKey = "linen";
  let fabric = "كتان";
  const collarKey = "classic";
  const collar = "كلاسيكية";
  let embroideryKey = "minimal";
  let embroidery = "بسيط";
  const style = "formal";
  let garmentType: import("@/types").GarmentType = "dishdasha";

  if (lower.includes("عبا") || lower.includes("abaya")) {
    garmentType = "abaya";
    if (lower.includes("أسود") || lower.includes("black")) {
      colorKey = "black";
      color = "أسود";
    }
  } else if (lower.includes("أسود") || lower.includes("black")) {
    colorKey = "black";
    color = "أسود";
  } else if (lower.includes("كحلي") || lower.includes("navy")) {
    colorKey = "navy";
    color = "كحلي";
  }

  if (lower.includes("صيف") || lower.includes("summer")) {
    fabricKey = "summer";
    fabric = "صيفي";
  }
  if (lower.includes("فاخر") || lower.includes("premium") || lower.includes("رسم")) {
    fabricKey = "premium";
    fabric = "فاخر";
    embroideryKey = "gold";
    embroidery = "ذهبي";
  }

  return {
    garmentType,
    color,
    colorKey,
    fabric,
    fabricKey,
    collar,
    collarKey,
    embroidery,
    embroideryKey,
    style,
    message_ar: `اقتراح: ${garmentType === "abaya" ? "عباية" : "دشداشة"} ${color} · ${fabric} · ${embroidery}`,
    message_en: `Suggestion: ${garmentType} ${color} ${fabric}`,
    reasons_ar: ["يتوافق مع المناسبة", "يناسب المناخ العماني", "خيار شائع"],
    reasons_en: ["Matches occasion", "Omani climate", "Popular choice"],
  };
}

interface StyleLLMJson {
  garmentType?: "dishdasha" | "abaya";
  color?: string;
  colorKey?: string;
  fabric?: string;
  fabricKey?: string;
  collar?: string;
  collarKey?: string;
  embroidery?: string;
  embroideryKey?: string;
  style?: string;
  message_ar?: string;
  reasons_ar?: string[];
}

export async function generateStyleRecommendation(
  prompt: string
): Promise<StyleRecommendation & { usedRealAI?: boolean }> {
  const system = `You are an Omani fashion stylist for dishdasha and abaya.
Return ONLY valid JSON with keys:
garmentType (dishdasha|abaya), color, colorKey, fabric, fabricKey, collar, collarKey, embroidery, embroideryKey, style, message_ar, reasons_ar (array of 3 Arabic strings).
Use Arabic values for display fields. colorKey: white|navy|black|beige. fabricKey: linen|summer|premium|cotton.`;

  const { content, provider } = await callLLMFromClient(system, prompt);

  if (content && isRealAIProvider(provider)) {
    const parsed = extractJsonFromLLM<StyleLLMJson>(content);
    const fallback = mockStyleRecommendation(prompt);
    if (parsed) {
      return {
        garmentType: parsed.garmentType ?? fallback.garmentType,
        color: parsed.color ?? fallback.color,
        colorKey: parsed.colorKey ?? fallback.colorKey,
        fabric: parsed.fabric ?? fallback.fabric,
        fabricKey: parsed.fabricKey ?? fallback.fabricKey,
        collar: parsed.collar ?? fallback.collar,
        collarKey: parsed.collarKey ?? fallback.collarKey,
        embroidery: parsed.embroidery ?? fallback.embroidery,
        embroideryKey: parsed.embroideryKey ?? fallback.embroideryKey,
        style: parsed.style ?? fallback.style,
        message_ar: parsed.message_ar ?? content,
        message_en: fallback.message_en,
        reasons_ar: parsed.reasons_ar ?? fallback.reasons_ar,
        reasons_en: fallback.reasons_en,
        usedRealAI: true,
      };
    }
    return { ...fallback, message_ar: content, usedRealAI: true };
  }

  return { ...mockStyleRecommendation(prompt), usedRealAI: false };
}

export async function generateDesignFromQuestions(answers: {
  garment?: string;
  occasion: string;
  color: string;
  budget: string;
  style: string;
}): Promise<StyleRecommendation & { aiRecommended: boolean; usedRealAI?: boolean }> {
  const prompt = `${answers.garment ? `نوع: ${answers.garment}, ` : ""}مناسبة: ${answers.occasion}, لون: ${answers.color}, ميزانية: ${answers.budget}, ستايل: ${answers.style}`;
  const rec = await generateStyleRecommendation(prompt);
  return {
    ...rec,
    aiRecommended: true,
    reasons_ar: rec.reasons_ar,
  };
}

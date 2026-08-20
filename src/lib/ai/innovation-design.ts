/**
 * Structured design updates from natural language — feeds version history.
 */

import type { InnovationDesignSpec } from "@/lib/innovation/types";
import { DEFAULT_INNOVATION_SPEC } from "@/lib/innovation/types";
import type { GarmentPart } from "@/lib/innovation/garment-parts";
import { extractFashionIntent } from "@/lib/ai/intent";
import { callLLM, extractJsonFromLLM, isRealAIProvider } from "@/lib/ai/provider";
import { callLLMWithVision } from "@/lib/ai/provider";

interface SpecPatch {
  spec: InnovationDesignSpec;
  summary_ar: string;
  summary_en: string;
}

/** When a part is focused, only apply patches that touch that region. */
const PART_ALLOWED_KEYS: Record<GarmentPart, Array<keyof InnovationDesignSpec>> = {
  sleeve: ["sleeves", "sleevesKey"],
  shoulder: ["opening", "openingKey", "fit", "fitKey"],
  chest: ["opening", "openingKey", "embroidery", "embroideryKey", "color", "colorKey", "colorHex"],
  waist: ["fit", "fitKey"],
  hem: ["length", "lengthKey"],
  embroidery: ["embroidery", "embroideryKey"],
};

const NL_PATCHES: Array<{ pattern: RegExp; patch: Partial<InnovationDesignSpec>; ar: string; en: string }> = [
  { pattern: /مفتوح|open/i, patch: { opening: "مفتوحة", openingKey: "front_open" }, ar: "قصة مفتوحة", en: "Open front" },
  { pattern: /واس|wide|relaxed/i, patch: { fit: "واسعة", fitKey: "wide", sleeves: "واسعة", sleevesKey: "wide" }, ar: "قصة أوسع", en: "Wider fit" },
  { pattern: /أطول|اطول|longer/i, patch: { length: "طويلة", lengthKey: "extra_long" }, ar: "طول أطول", en: "Longer length" },
  { pattern: /أقصر|اقصر|shorter/i, patch: { length: "متوسطة", lengthKey: "midi" }, ar: "طول أقصر", en: "Shorter length" },
  { pattern: /أكمام\s*أقل|sleeves?\s*less|narrow\s*sleeve/i, patch: { sleeves: "ضيقة", sleevesKey: "slim" }, ar: "أكمام أقل", en: "Narrower sleeves" },
  { pattern: /أكمام\s*أوس|wide\s*sleeve/i, patch: { sleeves: "واسعة", sleevesKey: "wide" }, ar: "أكمام أوسع", en: "Wider sleeves" },
  { pattern: /بدون\s*تطريز|no\s*emb/i, patch: { embroidery: "بدون", embroideryKey: "none" }, ar: "بدون تطريز", en: "No embroidery" },
  { pattern: /تطريز\s*ذهب|gold\s*emb/i, patch: { embroidery: "ذهبي بسيط", embroideryKey: "minimal_gold" }, ar: "تطريز ذهبي بسيط", en: "Minimal gold embroidery" },
  { pattern: /تطريز\s*بس|minimal\s*emb/i, patch: { embroidery: "بسيط", embroideryKey: "minimal" }, ar: "تطريز بسيط", en: "Minimal embroidery" },
  { pattern: /خفيف|light\s*fabric|crepe|chiffon|شيفون|كريب/i, patch: { fabric: "كريب", fabricKey: "crepe" }, ar: "قماش خفيف", en: "Light fabric" },
  { pattern: /فخم|premium|formal|رسم/i, patch: { fabric: "فاخر", fabricKey: "premium", occasion: "رسمي" }, ar: "مظهر فخم", en: "Premium look" },
  { pattern: /مطفي|matte|dark\s*black/i, patch: { color: "أسود مطفي", colorKey: "matte_black", colorHex: "#0d0d0d" }, ar: "أسود مطفي", en: "Matte black" },
  { pattern: /حمر|red/i, patch: { color: "أحمر", colorKey: "red", colorHex: "#8B0000" }, ar: "لون أحمر", en: "Red color" },
  { pattern: /أسود|black/i, patch: { color: "أسود", colorKey: "black", colorHex: "#1a1a1a" }, ar: "لون أسود", en: "Black color" },
  { pattern: /بيج|beige/i, patch: { color: "بيج", colorKey: "beige", colorHex: "#D4C4A8" }, ar: "لون بيج", en: "Beige color" },
];

function filterPatchForPart(
  patch: Partial<InnovationDesignSpec>,
  focusPart?: GarmentPart | null
): Partial<InnovationDesignSpec> {
  if (!focusPart) return patch;
  const allowed = new Set(PART_ALLOWED_KEYS[focusPart]);
  const next: Partial<InnovationDesignSpec> = {};
  for (const key of Object.keys(patch) as Array<keyof InnovationDesignSpec>) {
    if (allowed.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (next as any)[key] = patch[key];
    }
  }
  return next;
}

export function applyMessageToSpec(
  message: string,
  current: InnovationDesignSpec,
  focusPart?: GarmentPart | null
): SpecPatch {
  const changes: string[] = [];
  const changesEn: string[] = [];
  let spec: InnovationDesignSpec = { ...current };

  for (const { pattern, patch, ar, en } of NL_PATCHES) {
    if (pattern.test(message)) {
      const scoped = filterPatchForPart(patch, focusPart);
      if (Object.keys(scoped).length === 0) continue;
      spec = { ...spec, ...scoped };
      changes.push(ar);
      changesEn.push(en);
    }
  }

  if (changes.length === 0) {
    const intent = extractFashionIntent(message);
    const intentPatch: Partial<InnovationDesignSpec> = {};
    if (!focusPart && intent.garmentType) intentPatch.category = intent.garmentType;
    if (intent.color) {
      intentPatch.color = intent.color;
      intentPatch.colorKey = intent.colorKey ?? current.colorKey;
    }
    if (!focusPart && intent.fabric) {
      intentPatch.fabric = intent.fabric;
      intentPatch.fabricKey = intent.fabricKey ?? current.fabricKey;
    }
    if (intent.fit) {
      intentPatch.fit = intent.fit;
      intentPatch.fitKey = intent.fitKey ?? current.fitKey;
    }
    if (intent.embroidery) {
      intentPatch.embroidery = intent.embroidery;
      intentPatch.embroideryKey = intent.embroideryKey ?? current.embroideryKey;
    }
    if (!focusPart && intent.occasion) intentPatch.occasion = intent.occasion;
    if (!focusPart && intent.style === "رسمي") intentPatch.occasion = "رسمي";

    const scoped = filterPatchForPart(intentPatch, focusPart);
    if (Object.keys(scoped).length > 0 || !focusPart) {
      spec = { ...spec, ...scoped };
      changes.push(
        focusPart
          ? `تعديل ${focusPart}: ${intent.summary_ar}`
          : intent.summary_ar
      );
      changesEn.push(
        focusPart
          ? `${focusPart} update: ${intent.summary_en}`
          : intent.summary_en
      );
    } else {
      changes.push("حدّدي التعديل على الجزء المحدد");
      changesEn.push("Describe the change for the selected part");
    }
  }

  const partPrefix = focusPart ? `[${focusPart}] ` : "";
  return {
    spec,
    summary_ar: partPrefix + (changes.length ? changes.join(" + ") : "تحديث التصميم"),
    summary_en: partPrefix + (changesEn.length ? changesEn.join(" + ") : "Design update"),
  };
}

export async function analyzeInspirationImage(
  imageDataUrl: string,
  hint?: string
): Promise<{ spec: Partial<InnovationDesignSpec>; usedRealAI: boolean }> {
  const system = `Analyze Omani fashion garment. Return ONLY JSON:
{"category":"abaya|dishdasha","color":"Arabic","colorKey":"red|black|...","colorHex":"#...","fabric":"","opening":"","fit":"","sleeves":"","length":"","embroidery":"","occasion":""}`;

  const result = await callLLMWithVision(
    system,
    hint ?? "Extract all garment attributes for custom design.",
    imageDataUrl
  );

  if (result.content && isRealAIProvider(result.provider)) {
    const parsed = extractJsonFromLLM<Partial<InnovationDesignSpec & { category: string }>>(result.content);
    if (parsed) {
      return {
        spec: {
          category: parsed.category?.includes("abaya") ? "abaya" : "dishdasha",
          color: parsed.color,
          colorKey: parsed.colorKey,
          colorHex: parsed.colorHex,
          fabric: parsed.fabric,
          fabricKey: parsed.fabric?.includes("كريب") ? "crepe" : parsed.fabric?.includes("شيفون") ? "chiffon" : "custom",
          opening: parsed.opening,
          openingKey: parsed.openingKey,
          fit: parsed.fit,
          fitKey: parsed.fitKey,
          sleeves: parsed.sleeves,
          sleevesKey: parsed.sleevesKey,
          length: parsed.length,
          lengthKey: parsed.lengthKey,
          embroidery: parsed.embroidery,
          embroideryKey: parsed.embroideryKey,
          occasion: parsed.occasion,
        },
        usedRealAI: true,
      };
    }
  }

  const intent = extractFashionIntent(hint ?? "عباية");
  return {
    spec: {
      category: intent.garmentType ?? "abaya",
      color: intent.color ?? DEFAULT_INNOVATION_SPEC.color,
      colorKey: intent.colorKey ?? DEFAULT_INNOVATION_SPEC.colorKey,
      fabric: intent.fabric ?? DEFAULT_INNOVATION_SPEC.fabric,
      fabricKey: intent.fabricKey ?? DEFAULT_INNOVATION_SPEC.fabricKey,
    },
    usedRealAI: false,
  };
}

export async function generateCollaborationReply(
  message: string,
  spec: InnovationDesignSpec,
  history: string[]
): Promise<{ reply: string; usedRealAI: boolean }> {
  const system = `أنت شريك تصميم أزياء في استوديو "ابتكار" لمنصة خياطك.
تتعاون مع العميلة لبناء تصميم عباية/دشداشة. رد بالعربية بشكل طبيعي ومختصر.
اسأل سؤالًا واحدًا فقط إذا لزم. لا تؤكد إمكانية التنفيذ — الخياط يقرر ذلك.
التصميم الحالي: ${JSON.stringify(spec, null, 0)}`;

  const context = history.slice(-6).join("\n");
  const result = await callLLM(system, `${context}\n\nالعميل: ${message}`);

  if (result.content && isRealAIProvider(result.provider)) {
    return { reply: result.content, usedRealAI: true };
  }

  return {
    reply: `تمام. حدّثت التصميم: ${spec.color} · ${spec.fabric} · ${spec.opening ?? spec.fit ?? ""}. هل تريدين تعديلًا آخر؟`,
    usedRealAI: false,
  };
}

export async function summarizeForTailor(spec: InnovationDesignSpec): Promise<string> {
  const system = `Summarize this custom garment design for a tailor (Arabic, bullet points).
Include complexity estimate (low/medium/high). Do NOT confirm feasibility — only describe requirements.`;
  const result = await callLLM(system, JSON.stringify(spec));
  return result.content ?? `تصميم ${spec.category}: ${spec.color}, ${spec.fabric}, ${spec.embroidery}`;
}

export async function explainTailorResponse(
  decision: string,
  notes: string
): Promise<{ ar: string; en: string; usedRealAI: boolean }> {
  const system = `Explain tailor feasibility response to customer in simple Arabic and English.
Decision: ${decision}. Tailor notes: ${notes}.
Return JSON: {"ar":"","en":""}. Do not invent details beyond the notes.`;

  const result = await callLLM(system, notes);
  if (result.content && isRealAIProvider(result.provider)) {
    const parsed = extractJsonFromLLM<{ ar?: string; en?: string }>(result.content);
    if (parsed?.ar) {
      return { ar: parsed.ar, en: parsed.en ?? parsed.ar, usedRealAI: true };
    }
  }

  const map: Record<string, string> = {
    FEASIBLE: "الخياط أكد إمكانية تنفيذ التصميم.",
    NEEDS_CHANGES: "الخياط يستطيع تنفيذ التصميم بعد بعض التعديلات.",
    NOT_FEASIBLE: "الخياط لا يستطيع تنفيذ التصميم حاليًا.",
  };

  return {
    ar: `${map[decision] ?? "رد من الخياط."} ${notes}`,
    en: notes,
    usedRealAI: false,
  };
}

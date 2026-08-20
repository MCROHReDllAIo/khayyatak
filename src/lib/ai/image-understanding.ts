import { callVisionFromClient, callLLMFromClient, extractJsonFromLLM } from "./provider";

export interface ImageAnalysisResult {
  garmentType: string;
  colors: string[];
  fabric: string;
  cut: string;
  collar: string;
  sleeves: string;
  embroidery: string;
  style: string;
  occasion: string;
  confidence: number;
  usedRealAI?: boolean;
}

const DEMO_ANALYSES: Record<string, Partial<ImageAnalysisResult>> = {
  formal: {
    garmentType: "دشداشة عمانية",
    colors: ["أبيض"],
    fabric: "كتان فاخر",
    cut: "رسمي",
    collar: "كلاسيكية",
    sleeves: "طويلة",
    embroidery: "ذهبي بسيط",
    style: "رسمي",
    occasion: "مناسبات رسمية",
  },
  abaya: {
    garmentType: "عباية",
    colors: ["أسود"],
    fabric: "كريب",
    cut: "فراشة",
    collar: "دائري",
    sleeves: "واسعة",
    embroidery: "فضي",
    style: "أنيق",
    occasion: "يومي / دوام",
  },
};

function demoAnalysis(hint?: string): ImageAnalysisResult {
  const lower = (hint ?? "").toLowerCase();
  const base =
    lower.includes("عبا") || lower.includes("abaya")
      ? DEMO_ANALYSES.abaya
      : DEMO_ANALYSES.formal;

  return {
    garmentType: base.garmentType ?? "دشداشة",
    colors: base.colors ?? ["أبيض"],
    fabric: base.fabric ?? "قطن",
    cut: base.cut ?? "كلاسيكي",
    collar: base.collar ?? "كلاسيكية",
    sleeves: base.sleeves ?? "طويلة",
    embroidery: base.embroidery ?? "بدون",
    style: base.style ?? "رسمي",
    occasion: base.occasion ?? "يومي",
    confidence: 91,
    usedRealAI: false,
  };
}

interface VisionJson {
  garmentType?: string;
  colors?: string[];
  fabric?: string;
  cut?: string;
  collar?: string;
  sleeves?: string;
  embroidery?: string;
  style?: string;
  occasion?: string;
  confidence?: number;
}

export async function analyzeGarmentImage(
  imageData?: string,
  hint?: string
): Promise<ImageAnalysisResult> {
  if (!imageData) {
    await new Promise((r) => setTimeout(r, 800));
    return demoAnalysis(hint);
  }

  const system = `You analyze Omani fashion garment photos (dishdasha, abaya, thobe).
Return ONLY valid JSON:
{"garmentType":"","colors":[],"fabric":"","cut":"","collar":"","sleeves":"","embroidery":"","style":"","occasion":"","confidence":0-100}
Use Arabic for descriptive values.`;

  const userPrompt = hint
    ? `حلل هذه الصورة. تلميح من المستخدم: ${hint}`
    : "حلل قطعة الأزياء في الصورة — نوع القطعة، الألوان، القماش، القصة، الياقة، الأكم، التطريز، الستايل، المناسبة.";

  const { content, provider } = await callVisionFromClient(system, userPrompt, imageData);

  if (content && provider && provider !== "mock") {
    const parsed = extractJsonFromLLM<VisionJson>(content);
    if (parsed) {
      return {
        garmentType: parsed.garmentType ?? "دشداشة",
        colors: parsed.colors ?? ["أبيض"],
        fabric: parsed.fabric ?? "قطن",
        cut: parsed.cut ?? "كلاسيكي",
        collar: parsed.collar ?? "كلاسيكية",
        sleeves: parsed.sleeves ?? "طويلة",
        embroidery: parsed.embroidery ?? "بدون",
        style: parsed.style ?? "رسمي",
        occasion: parsed.occasion ?? "يومي",
        confidence: parsed.confidence ?? 88,
        usedRealAI: true,
      };
    }
  }

  await new Promise((r) => setTimeout(r, 1200));
  return demoAnalysis(hint);
}

export async function generateMarketingCampaign(audience: string): Promise<{
  text: string;
  name: string;
  offer: string;
  usedRealAI: boolean;
}> {
  const system = `You create Arabic marketing campaigns for an Omani tailor shop on Khayyatak (خياطك).
Return JSON: {"name":"","offer":"","message_ar":""} — message_ar is WhatsApp-ready Arabic copy with emojis.`;

  const { content, provider } = await callLLMFromClient(
    system,
    `Audience: ${audience}. Create a reorder/loyalty campaign for Ramadan or formal season.`
  );

  if (content && provider && provider !== "mock") {
    const parsed = extractJsonFromLLM<{ name?: string; offer?: string; message_ar?: string }>(content);
    if (parsed?.message_ar) {
      return {
        text: parsed.message_ar,
        name: parsed.name ?? "حملة AI",
        offer: parsed.offer ?? "عرض خاص",
        usedRealAI: true,
      };
    }
    return { text: content, name: "حملة AI", offer: "عرض خاص", usedRealAI: true };
  }

  return {
    text: `🎯 عرض خاص لـ ${audience}!\n\n"قياساتك محفوظة — أعد طلب ثوبك المفضل خلال 48 ساعة."\n\n#SmartTailorAI`,
    name: "عرض إعادة طلب",
    offer: "تطريز مجاني",
    usedRealAI: false,
  };
}

export async function generateProductFromHint(hint?: string): Promise<{
  name: string;
  description: string;
  price: string;
  tags: string[];
  usedRealAI: boolean;
}> {
  const system = `You create product listings for an Omani tailor.
Return JSON: {"name_ar":"","description_ar":"","price_omr":"18.500","tags":["",""]}
Price in OMR as string like "18.500". Arabic text.`;

  const { content, provider } = await callLLMFromClient(
    system,
    hint ?? "دشداشة عمانية رسمية بيضاء كتان فاخر تطريز ذهبي"
  );

  if (content && provider && provider !== "mock") {
    const parsed = extractJsonFromLLM<{
      name_ar?: string;
      description_ar?: string;
      price_omr?: string;
      tags?: string[];
    }>(content);
    if (parsed?.name_ar) {
      return {
        name: parsed.name_ar,
        description: parsed.description_ar ?? "",
        price: parsed.price_omr ?? "18.500",
        tags: parsed.tags ?? ["رسمي"],
        usedRealAI: true,
      };
    }
  }

  return {
    name: "الدشداشة العمانية الرسمية — الأبيض الفاخر",
    description: "دشداشة عمانية رسمية من كتان فاخر، ياقة كلاسيكية، تطريز ذهبي بسيط.",
    price: "18.500",
    tags: ["رسمي", "كتان", "أبيض"],
    usedRealAI: false,
  };
}

export async function analyzeQualityImage(
  imageDataUrl: string,
  expectedDesign: string
): Promise<{ pass: number; issue?: string; usedRealAI: boolean }> {
  const system = `You compare a finished Omani garment photo to expected design specs.
Return JSON: {"pass_score":0-100,"issue_ar":"","status":"pass|warning|mismatch"}
Never claim certified QC. Be honest — AI Estimate only.`;

  const { content, provider } = await callVisionFromClient(
    system,
    `Expected design: ${expectedDesign}\nCompare the finished garment in the image.`,
    imageDataUrl
  );

  if (content && provider && provider !== "mock") {
    const parsed = extractJsonFromLLM<{
      pass_score?: number;
      issue_ar?: string;
    }>(content);
    if (parsed) {
      return {
        pass: parsed.pass_score ?? 85,
        issue: parsed.issue_ar ? `${parsed.issue_ar} — AI Estimate` : undefined,
        usedRealAI: true,
      };
    }
  }

  return {
    pass: 92,
    issue: "التطريز يبدو مختلفًا قليلًا عن التصميم — Demo AI Estimate",
    usedRealAI: false,
  };
}

export function analysisToDesignConfig(analysis: ImageAnalysisResult) {
  const colorMap: Record<string, { key: string; ar: string }> = {
    أبيض: { key: "white", ar: "أبيض" },
    أسود: { key: "black", ar: "أسود" },
    كحلي: { key: "navy", ar: "كحلي" },
  };
  const color = colorMap[analysis.colors[0]] ?? { key: "white", ar: "أبيض" };
  const isAbaya = analysis.garmentType.includes("عبا");

  return {
    garmentType: isAbaya ? ("abaya" as const) : ("dishdasha" as const),
    color: color.ar,
    colorKey: color.key,
    fabric: analysis.fabric.includes("كتان") ? "كتان" : "قطني",
    fabricKey: analysis.fabric.includes("كتان") ? "linen" : "cotton",
    collar: analysis.collar,
    collarKey: analysis.collar.includes("فراش") ? "butterfly" : "classic",
    embroidery: analysis.embroidery.includes("ذهب") ? "ذهبي" : analysis.embroidery.includes("فض") ? "فضي" : "بدون",
    embroideryKey: analysis.embroidery.includes("ذهب") ? "gold" : analysis.embroidery.includes("فض") ? "silver" : "none",
    name: `تصميم من صورة — ${analysis.garmentType}`,
  };
}

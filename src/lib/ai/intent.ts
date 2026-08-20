import type { DesignConfig, GarmentType } from "@/types";

export interface FashionIntent {
  garmentType?: GarmentType;
  color?: string;
  colorKey?: string;
  fabric?: string;
  fabricKey?: string;
  fit?: string;
  fitKey?: string;
  season?: string;
  style?: string;
  occasion?: string;
  embroidery?: string;
  embroideryKey?: string;
  budget?: string;
  summary_ar: string;
  summary_en: string;
}

export function extractFashionIntent(message: string): FashionIntent {
  const m = message.toLowerCase();
  const intent: FashionIntent = {
    summary_ar: "طلب أزياء",
    summary_en: "Fashion request",
  };

  if (/عبا|abaya/.test(m)) intent.garmentType = "abaya";
  else if (/دش|ثوب|dishdasha|thobe/.test(m)) intent.garmentType = "dishdasha";

  if (/أبيض|بيض|white/.test(m)) {
    intent.color = "أبيض";
    intent.colorKey = "white";
  } else if (/كحل|navy/.test(m)) {
    intent.color = "كحلي";
    intent.colorKey = "navy";
  } else if (/أسود|black/.test(m)) {
    intent.color = "أسود";
    intent.colorKey = "black";
  } else if (/بيج|beige/.test(m)) {
    intent.color = "بيج";
    intent.colorKey = "beige";
  }

  if (/صيف|summer|خفيف/.test(m)) {
    intent.fabric = "صيفي";
    intent.fabricKey = "summer";
    intent.season = "summer";
  } else if (/كتان|linen/.test(m)) {
    intent.fabric = "كتان";
    intent.fabricKey = "linen";
  } else if (/فاخ|premium|فخم/.test(m)) {
    intent.fabric = "فاخر";
    intent.fabricKey = "premium";
  }

  if (/أنحف|ضيق|slim|ما\s*(?:أ|ا)ب(?:غ|گ)اه\s*واس|لا\s*(?:يكون|يكون)\s*واس|مو\s*واس|بس\s*مو\s*واس/i.test(m)) {
    intent.fit = "أنحف";
    intent.fitKey = "slim";
  } else if (/واس|relaxed|regular/.test(m)) {
    intent.fit = "قياسي";
    intent.fitKey = "regular";
  }

  if (/رسم|formal|دوام/.test(m)) {
    intent.style = "رسمي";
    intent.occasion = "رسمي";
  } else if (/يوم|casual/.test(m)) {
    intent.style = "يومي";
    intent.occasion = "يومي";
  } else if (/زفاف|wedding/.test(m)) {
    intent.style = "مناسبات";
    intent.occasion = "زفاف";
  }

  if (/تطريز\s*ذهب|gold\s*emb/.test(m)) {
    intent.embroidery = "ذهبي";
    intent.embroideryKey = "gold";
  } else if (/تطريز\s*بس|minimal|(?:ما|لا)\s*أ(?:ري|بغى)\s*(?:التطريز\s*)?واج/.test(m)) {
    intent.embroidery = "بسيط";
    intent.embroideryKey = "minimal";
  } else if (/بدون\s*تطريز|no\s*emb/.test(m)) {
    intent.embroidery = "بدون";
    intent.embroideryKey = "none";
  }

  if (/10\s*[-–]\s*15|١٠|10/.test(m)) intent.budget = "10-15 ر.ع";
  else if (/15\s*[-–]\s*20|١٥|15/.test(m)) intent.budget = "15-20 ر.ع";
  else if (/20\s*[-–]\s*25|٢٠|20/.test(m)) intent.budget = "20-25 ر.ع";

  const parts: string[] = [];
  if (intent.garmentType === "abaya") parts.push("عباية");
  else if (intent.garmentType === "dishdasha") parts.push("دشداشة");
  if (intent.color) parts.push(intent.color);
  if (intent.fabric) parts.push(intent.fabric);
  if (intent.style) parts.push(intent.style);
  if (intent.fit) parts.push(intent.fit);

  intent.summary_ar = parts.length ? parts.join(" · ") : "تصميم مخصص";
  intent.summary_en = parts.length ? parts.join(" · ") : "Custom design";

  return intent;
}

export function intentToDesignConfig(intent: FashionIntent, base?: DesignConfig): DesignConfig {
  const d = base ?? {
    garmentType: "dishdasha" as const,
    color: "أبيض",
    colorKey: "white",
    fabric: "كتان",
    fabricKey: "linen",
    collar: "عمانية",
    collarKey: "omani",
    embroidery: "بسيط",
    embroideryKey: "minimal",
  };

  return {
    ...d,
    garmentType: intent.garmentType ?? d.garmentType,
    color: intent.color ?? d.color,
    colorKey: intent.colorKey ?? d.colorKey,
    fabric: intent.fabric ?? d.fabric,
    fabricKey: intent.fabricKey ?? d.fabricKey,
    fit: intent.fit ?? d.fit,
    fitKey: intent.fitKey ?? d.fitKey,
    embroidery: intent.embroidery ?? d.embroidery,
    embroideryKey: intent.embroideryKey ?? d.embroideryKey,
    collarKey: intent.fitKey === "slim" ? "modern" : d.collarKey,
    collar: intent.fitKey === "slim" ? "عصرية" : d.collar,
    name: intent.summary_ar,
  };
}

export function formatIntentReply(intent: FashionIntent): string {
  const lines = [
    "فهمت طلبك:",
    "",
    `• القطعة: ${intent.garmentType === "abaya" ? "عباية" : "دشداشة عمانية"}`,
    intent.color ? `• اللون: ${intent.color}` : null,
    intent.fabric ? `• القماش: ${intent.fabric}` : null,
    intent.style ? `• الستايل: ${intent.style}` : null,
    intent.fit ? `• القصة: ${intent.fit}` : null,
    intent.embroidery ? `• التطريز: ${intent.embroidery}` : null,
    intent.budget ? `• الميزانية: ${intent.budget}` : null,
    "",
    "هل تريدني أن أصممها لك في الاستوديو؟",
  ].filter(Boolean);

  return lines.join("\n");
}

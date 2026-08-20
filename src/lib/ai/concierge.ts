import type { DesignConfig } from "@/types";
import { callLLMFromClient, isRealAIProvider } from "./provider";
import { extractFashionIntent, formatIntentReply, intentToDesignConfig } from "./intent";

export interface NLDesignChange {
  field: string;
  field_ar: string;
  from: string;
  to: string;
}

const NL_PATTERNS: {
  pattern: RegExp;
  apply: (d: DesignConfig) => Partial<DesignConfig> & { change: NLDesignChange };
}[] = [
  {
    pattern: /أنحف|أضيق|slim|ضيق|ما\s*(?:أ|ا)ب(?:غ|گ)اه\s*واس|لا\s*(?:يكون|يكون)\s*واس|مو\s*واس|بس\s*مو\s*واس/i,
    apply: (d) => ({
      fitKey: "slim",
      fit: "أنحف",
      collarKey: "modern",
      collar: "عصرية",
      change: { field: "fit", field_ar: "القصة", from: d.fit ?? d.collar, to: "أنحف" },
    }),
  },
  {
    pattern: /كحلي|navy|أزرق/i,
    apply: (d) => ({
      colorKey: "navy",
      color: "كحلي",
      change: { field: "color", field_ar: "اللون", from: d.color, to: "كحلي" },
    }),
  },
  {
    pattern: /صيف|summer|خفيف/i,
    apply: (d) => ({
      fabricKey: "summer",
      fabric: "صيفي",
      change: { field: "fabric", field_ar: "القماش", from: d.fabric, to: "صيفي" },
    }),
  },
  {
    pattern: /تطريز\s*ذهب|gold/i,
    apply: (d) => ({
      embroideryKey: "gold",
      embroidery: "ذهبي",
      change: { field: "embroidery", field_ar: "التطريز", from: d.embroidery, to: "ذهبي" },
    }),
  },
  {
    pattern: /تطريز\s*بس|embroidery minimal|بسيط|(?:ما|لا)\s*أ(?:ري|بغى)\s*(?:التطريز\s*)?واج/i,
    apply: (d) => ({
      embroideryKey: "minimal",
      embroidery: "بسيط",
      change: { field: "embroidery", field_ar: "التطريز", from: d.embroidery, to: "بسيط" },
    }),
  },
  {
    pattern: /رسم|فخم|formal|premium/i,
    apply: (d) => ({
      fabricKey: "premium",
      fabric: "فاخر",
      embroideryKey: "gold",
      embroidery: "ذهبي",
      change: { field: "style", field_ar: "الستايل", from: d.fabric, to: "رسمي فاخر" },
    }),
  },
  {
    pattern: /أبيض|بيض|white/i,
    apply: (d) => ({
      colorKey: "white",
      color: "أبيض",
      change: { field: "color", field_ar: "اللون", from: d.color, to: "أبيض" },
    }),
  },
  {
    pattern: /أسود|black/i,
    apply: (d) => ({
      colorKey: "black",
      color: "أسود",
      garmentType: "abaya",
      change: { field: "color", field_ar: "اللون", from: d.color, to: "أسود" },
    }),
  },
];

export function applyNaturalLanguageDesign(
  prompt: string,
  current: DesignConfig
): { design: DesignConfig; changes: NLDesignChange[] } {
  const changes: NLDesignChange[] = [];
  let design = { ...current };

  for (const { pattern, apply } of NL_PATTERNS) {
    if (pattern.test(prompt)) {
      const result = apply(design);
      const { change, ...updates } = result;
      design = { ...design, ...updates };
      changes.push(change);
    }
  }

  if (changes.length === 0) {
    const intent = extractFashionIntent(prompt);
    design = intentToDesignConfig(intent, design);
    changes.push({ field: "ai", field_ar: "AI", from: "—", to: intent.summary_ar });
  }

  return { design, changes };
}

export async function conciergeRespond(
  message: string,
  history: string[] = []
): Promise<{
  reply: string;
  suggestedActions: string[];
  intentDesign?: DesignConfig;
  usedRealAI?: boolean;
}> {
  const intent = extractFashionIntent(message);
  const intentDesign = intentToDesignConfig(intent);
  const intentSummary = formatIntentReply(intent);

  const system = `أنت مساعد أزياء عماني ذكي لمنصة خياطك (Khayyatak). تفهم الدشداشة العمانية والعبايات واللهجة الخليجية.
استخرج: نوع القطعة، اللون، القماش، الستايل، المناسبة، القصة.
رد بالعربية بشكل طبيعي ومختصر. اذكر التفاصيل المستخرجة ثم اسأل إن كان يريد التصميم في الاستوديو.`;

  const context = history.length ? `سياق المحادثة: ${history.slice(-4).join(" | ")}\n` : "";
  const { content: llm, provider } = await callLLMFromClient(
    system,
    `${context}العميل: ${message}\n\nملخص النية المستخرجة:\n${intentSummary}`
  );

  if (llm && isRealAIProvider(provider)) {
    return {
      reply: llm,
      suggestedActions: ["أنشئ التصميم", "غيّر القماش", "أرني خيارات", "ابحث عن خياط"],
      intentDesign,
      usedRealAI: true,
    };
  }

  return {
    reply: intentSummary,
    suggestedActions: ["أنشئ التصميم", "غيّر القماش", "أرني خيارات", "ابحث عن خياط"],
    intentDesign,
    usedRealAI: false,
  };
}

export { extractFashionIntent, intentToDesignConfig, formatIntentReply };

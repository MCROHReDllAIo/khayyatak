/**
 * Structured product search intent — validated before DB query.
 */

export interface ProductSearchIntent {
  category?: "abaya" | "dishdasha" | "thobe" | "other";
  color?: string;
  colorKey?: string;
  style?: string;
  styleCut?: string;
  gender?: "women" | "men" | "unisex";
  fabric?: string;
  occasion?: string;
  embroidery?: string;
  budgetMax?: number;
  rawMessage: string;
}

const COLOR_MAP: Array<{ keys: RegExp; color: string; colorKey: string }> = [
  { keys: /حمر|أحمر|احمر|red/i, color: "أحمر", colorKey: "red" },
  { keys: /أسود|اسود|black/i, color: "أسود", colorKey: "black" },
  { keys: /أبيض|ابيض|white/i, color: "أبيض", colorKey: "white" },
  { keys: /بيج|beige|كريم/i, color: "بيج", colorKey: "beige" },
  { keys: /كحل|navy|أزرق|ازرق|blue/i, color: "كحلي", colorKey: "navy" },
  { keys: /ذهب|gold/i, color: "ذهبي", colorKey: "gold" },
  { keys: /أغمق|اغمق|darker|dark/i, color: "داكن", colorKey: "dark" },
];

const STYLE_CUT_MAP: Array<{ keys: RegExp; style: string; styleCut: string }> = [
  { keys: /مفتوح|open/i, style: "مفتوحة", styleCut: "open" },
  { keys: /واس|wide|relaxed/i, style: "واسعة", styleCut: "wide" },
  { keys: /أنحف|ضيق|slim|ما\s*(?:أ|ا)ب(?:غ|گ)اه\s*واس/i, style: "أنحف", styleCut: "slim" },
  { keys: /رسم|formal|فخم|premium/i, style: "رسمية", styleCut: "formal" },
  { keys: /بسيط|simple|minimal/i, style: "بسيطة", styleCut: "simple" },
  { keys: /صيف|summer|خفيف/i, style: "صيفية", styleCut: "summer" },
];

export function extractProductSearchIntent(
  message: string,
  context?: ProductSearchIntent | null
): ProductSearchIntent {
  const m = message.trim();
  const intent: ProductSearchIntent = {
    rawMessage: m,
    gender: context?.gender ?? "women",
  };

  if (context) {
    Object.assign(intent, {
      category: context.category,
      color: context.color,
      colorKey: context.colorKey,
      style: context.style,
      styleCut: context.styleCut,
      fabric: context.fabric,
      occasion: context.occasion,
      embroidery: context.embroidery,
    });
  }

  if (/عبا|abaya/i.test(m)) {
    intent.category = "abaya";
    intent.gender = "women";
  } else if (/دش|ثوب|dishdasha|thobe/i.test(m)) {
    intent.category = "dishdasha";
    intent.gender = "men";
  }

  for (const { keys, color, colorKey } of COLOR_MAP) {
    if (keys.test(m)) {
      intent.color = color;
      intent.colorKey = colorKey;
      break;
    }
  }

  for (const { keys, style, styleCut } of STYLE_CUT_MAP) {
    if (keys.test(m)) {
      intent.style = style;
      intent.styleCut = styleCut;
      break;
    }
  }

  if (/كريب|crepe/i.test(m)) intent.fabric = "كريب";
  else if (/كتان|linen/i.test(m)) intent.fabric = "كتان";
  else if (/شيفون|chiffon/i.test(m)) intent.fabric = "شيفون";

  if (/عيد|eid/i.test(m)) intent.occasion = "عيد";
  else if (/زفاف|wedding/i.test(m)) intent.occasion = "زفاف";
  else if (/دوام|formal|work/i.test(m)) intent.occasion = "رسمي";

  if (/بدون\s*تطريز|no\s*emb/i.test(m)) intent.embroidery = "none";
  else if (/تطريز\s*بس|minimal\s*emb/i.test(m)) intent.embroidery = "minimal";
  else if (/تطريز|embroidery/i.test(m)) intent.embroidery = "yes";

  if (/أطول|اطول|longer/i.test(m)) {
    intent.styleCut = context?.styleCut ? `${context.styleCut}-long` : "long";
    intent.style = `${context?.style ?? ""} أطول`.trim();
  }
  if (/أوسع|اوسع|wider/i.test(m)) {
    intent.styleCut = "wide";
    intent.style = "واسعة";
  }

  const budgetMatch = m.match(/(\d+)\s*ر\.?\s*ع/);
  if (budgetMatch) intent.budgetMax = Number(budgetMatch[1]);

  return intent;
}

export function isProductSearchMessage(message: string): boolean {
  return (
    /أبغ|ابغ|أريد|اريد|بدي|want|need|looking|دور|لق|find|عبا|abaya|دش|ثوب|product|منتج/i.test(message) ||
    /لون|color|قماش|fabric|مفتوح|open|حمر|red|أسود|black/i.test(message)
  );
}

export function isContextualModification(message: string): boolean {
  return /^(خلي|خل|بدون|نفس|الأول|الاول|اول|first|ها|هذ|this|same)/i.test(message.trim());
}

export function isProductSelectionMessage(message: string): boolean {
  return /^(الأول|الاول|اول|first|1|الثاني|second|2|الثالث|third|3|هذ|ها|this|اختر|choose)/i.test(message.trim());
}

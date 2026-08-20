import type { DesignConfig } from "@/types";
import type { MatchedProduct } from "@/lib/db/products";
import { searchProducts, saveProductSearchSession } from "@/lib/db/products";
import { callLLM, isRealAIProvider } from "@/lib/ai/provider";
import { logAICall } from "@/lib/db/analytics";
import {
  extractProductSearchIntent,
  isProductSearchMessage,
  isContextualModification,
  isProductSelectionMessage,
  type ProductSearchIntent,
} from "@/lib/ai/product-intent";
import { intentToDesignConfig, extractFashionIntent } from "@/lib/ai/intent";

import type { ConciergeShoppingContext } from "@/lib/ai/concierge-types";

export type { ConciergeShoppingContext };

export interface ConciergeShoppingResponse {
  reply: string;
  reply_en: string;
  suggestedActions: string[];
  products: MatchedProduct[];
  intent: ProductSearchIntent;
  intentDesign?: DesignConfig;
  exactMatch: boolean;
  usedRealAI: boolean;
  flow?: "search" | "select" | "size" | "virtual_look" | "order" | "modify";
  selectedProduct?: MatchedProduct | null;
}

function normalizeMatchScore(raw: number, best: number): number {
  if (best <= 0) return 0;
  return Math.min(99, Math.round((raw / Math.max(best, 1)) * 100));
}

function productToDesign(product: MatchedProduct): DesignConfig {
  const garmentType = product.category === "abaya" ? "abaya" : "dishdasha";
  return {
    garmentType,
    color: product.color ?? "—",
    colorKey: product.color_key ?? "custom",
    fabric: product.fabric ?? "—",
    fabricKey: product.fabric?.toLowerCase() ?? "custom",
    collar: product.style ?? "—",
    collarKey: product.style_cut ?? "custom",
    embroidery: "بسيط",
    embroideryKey: "minimal",
    fit: product.style ?? undefined,
    fitKey: product.style_cut ?? undefined,
    name: product.name_ar,
  };
}

function buildSearchReply(products: MatchedProduct[], exact: boolean): { ar: string; en: string; actions: string[] } {
  if (products.length === 0) {
    return {
      ar: "لا توجد منتجات مطابقة حاليًا.",
      en: "No matching products available right now.",
      actions: ["ابحث عن خياط", "صمّم بالذكاء الاصطناعي"],
    };
  }

  const best = products[0]?.match_score ?? 0;
  const exactEnough = exact && best >= 50;

  return {
    ar: exactEnough
      ? "لقيت لك هذه الخيارات من قاعدة بيانات خياطك:"
      : "ما حصلت منتج مطابق تمامًا، لكن هذه أقرب الخيارات لك:",
    en: exactEnough
      ? "Here are matching options from Khayyatak:"
      : "No exact match, but here are the closest options:",
    actions: ["الأول", "اختيار المقاس", "نظرة افتراضية", "تفاصيل المنتج"],
  };
}

export async function conciergeShoppingRespond(
  message: string,
  context: ConciergeShoppingContext,
  userId: string | null
): Promise<ConciergeShoppingResponse> {
  const start = Date.now();
  let usedRealAI = false;

  if (isProductSelectionMessage(message) && context.lastProducts?.length) {
    const idx = /ثاني|second|2/.test(message) ? 1 : /ثالث|third|3/.test(message) ? 2 : 0;
    const selected = context.lastProducts[idx] ?? context.lastProducts[0];

    return {
      reply: `تمام. اخترت "${selected.name_ar}". هل تريد استخدام مقاساتك المحفوظة؟`,
      reply_en: `Got it. Selected "${selected.name_en ?? selected.name_ar}". Use saved measurements?`,
      suggestedActions: ["استخدم مقاساتي", "إدخال مقاسات", "نظرة افتراضية", "اختيار هذا التصميم"],
      products: [selected],
      intent: context.lastIntent ?? extractProductSearchIntent(message),
      intentDesign: productToDesign(selected),
      exactMatch: true,
      usedRealAI: false,
      flow: "select",
      selectedProduct: selected,
    };
  }

  const intent = isContextualModification(message)
    ? extractProductSearchIntent(message, context.lastIntent)
    : extractProductSearchIntent(message);

  const shouldSearch = isProductSearchMessage(message) || isContextualModification(message);

  if (!shouldSearch) {
    const fashionIntent = extractFashionIntent(message);
    const intentDesign = intentToDesignConfig(fashionIntent);
    const system = `أنت مساعد أزياء عماني لمنصة خياطك. رد بالعربية باختصار.`;
    const llm = await callLLM(system, message);
    usedRealAI = Boolean(llm.content && isRealAIProvider(llm.provider));

    await logAICall({
      userId: userId ?? undefined,
      feature: "concierge",
      provider: llm.provider,
      model: llm.model,
      status: llm.content ? "success" : "fallback",
      latencyMs: Date.now() - start,
    });

    return {
      reply: llm.content ?? "كيف أقدر أساعدك في الأزياء العمانية اليوم؟",
      reply_en: llm.content ?? "How can I help with Omani fashion today?",
      suggestedActions: ["أبغى عباية", "ابحث عن خياط", "صمّم بالذكاء الاصطناعي"],
      products: [],
      intent,
      intentDesign,
      exactMatch: false,
      usedRealAI,
    };
  }

  const products = await searchProducts(intent, 3);
  const bestScore = products[0]?.match_score ?? 0;
  const exactMatch = bestScore >= 50;

  for (const p of products) {
    p.match_score = normalizeMatchScore(p.match_score, bestScore || p.match_score);
  }

  await saveProductSearchSession(userId, message, intent, products);

  const { ar, en, actions } = buildSearchReply(products, exactMatch);

  const system = `أنت Personal Shopper لمنصة خياطك. رد جملة واحدة بالعربية ت introducing النتائج. لا تختلق منتجات.`;
  const llm = await callLLM(
    system,
    `طلب العميل: ${message}\nعدد النتائج: ${products.length}\n${products.map((p) => p.name_ar).join(", ")}`
  );

  if (llm.content && isRealAIProvider(llm.provider)) {
    usedRealAI = true;
  }

  await logAICall({
    userId: userId ?? undefined,
    feature: "product_search",
    provider: llm.provider,
    model: llm.model,
    status: products.length ? "success" : "fallback",
    latencyMs: Date.now() - start,
  });

  return {
    reply: usedRealAI && llm.content ? llm.content : ar,
    reply_en: en,
    suggestedActions: products.length ? actions : ["صمّم بالذكاء الاصطناعي", "ابحث عن خياط"],
    products,
    intent,
    intentDesign: products[0] ? productToDesign(products[0]) : intentToDesignConfig(extractFashionIntent(message)),
    exactMatch,
    usedRealAI,
    flow: "search",
  };
}

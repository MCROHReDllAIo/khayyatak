import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-auth";
import { conciergeShoppingRespond } from "@/lib/ai/concierge-shopping";
import type { ConciergeShoppingContext } from "@/lib/ai/concierge-types";
import { callLLMWithVision, extractJsonFromLLM, isRealAIProvider } from "@/lib/ai/provider";
import { extractProductSearchIntent, type ProductSearchIntent } from "@/lib/ai/product-intent";
import { logAICall } from "@/lib/db/analytics";
import { runStyleTwin } from "@/lib/ml/style-twin";
import type { MatchedProduct } from "@/lib/db/products";

interface VisionIntentJson {
  category?: string;
  color?: string;
  colorKey?: string;
  style?: string;
  styleCut?: string;
  fabric?: string;
  occasion?: string;
  embroidery?: string;
}

async function intentFromVision(imageDataUrl: string, hint?: string): Promise<ProductSearchIntent | null> {
  const start = Date.now();
  const system = `Analyze Omani fashion garment photo. Return ONLY JSON:
{"category":"abaya|dishdasha","color":"Arabic","colorKey":"red|black|...","style":"Arabic","styleCut":"open|wide|formal|...","fabric":"","occasion":"","embroidery":""}`;

  const result = await callLLMWithVision(
    system,
    hint ?? "Extract garment attributes for product search.",
    imageDataUrl
  );

  await logAICall({
    feature: "vision_product_search",
    provider: result.provider,
    model: result.model,
    status: result.content ? "success" : "fallback",
    latencyMs: Date.now() - start,
  });

  if (!result.content || !isRealAIProvider(result.provider)) return null;

  const parsed = extractJsonFromLLM<VisionIntentJson>(result.content);
  if (!parsed) return null;

  return extractProductSearchIntent(
    `${parsed.category ?? ""} ${parsed.color ?? ""} ${parsed.style ?? ""} ${hint ?? ""}`,
    {
      rawMessage: hint ?? "image search",
      category: parsed.category?.includes("abaya") ? "abaya" : parsed.category?.includes("dish") ? "dishdasha" : undefined,
      color: parsed.color,
      colorKey: parsed.colorKey,
      style: parsed.style,
      styleCut: parsed.styleCut,
      fabric: parsed.fabric,
      occasion: parsed.occasion,
      embroidery: parsed.embroidery,
      gender: parsed.category?.includes("abaya") ? "women" : "men",
    }
  );
}

function twinToMatched(m: {
  id: string;
  tailor_id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  category: string | null;
  tags: string[];
  price: number;
  fabric: string | null;
  style: string | null;
  style_cut: string | null;
  color: string | null;
  color_key: string | null;
  occasion: string | null;
  image_url: string | null;
  available: boolean;
  tailor_name_ar: string | null;
  tailor_rating: number;
  match_percent: number;
  match_reasons: string[];
}): MatchedProduct {
  return {
    id: m.id,
    tailor_id: m.tailor_id,
    name_ar: m.name_ar,
    name_en: m.name_en,
    description_ar: m.description_ar,
    category: m.category,
    tags: m.tags,
    price: m.price,
    fabric: m.fabric,
    style: m.style,
    style_cut: m.style_cut,
    color: m.color,
    color_key: m.color_key,
    occasion: m.occasion,
    image_url: m.image_url,
    available: m.available,
    tailor_name_ar: m.tailor_name_ar,
    tailor_rating: m.tailor_rating,
    match_score: m.match_percent,
    match_reasons: m.match_reasons,
  };
}

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    const body = await request.json();
    const {
      message,
      imageDataUrl,
      context,
    } = body as {
      message: string;
      imageDataUrl?: string;
      context?: ConciergeShoppingContext;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    let shoppingContext: ConciergeShoppingContext = context ?? {};

    if (imageDataUrl) {
      const visionIntent = await intentFromVision(imageDataUrl, message);
      if (visionIntent) {
        shoppingContext = { ...shoppingContext, lastIntent: visionIntent };
      }
    }

    const [response, twin] = await Promise.all([
      conciergeShoppingRespond(message, shoppingContext, user?.id ?? null),
      imageDataUrl
        ? runStyleTwin({ imageDataUrl, text: message, limit: 6 })
        : Promise.resolve(null),
    ]);

    let products = response.products;
    let reply = response.reply;
    let reply_en = response.reply_en;

    if (twin?.ok && twin.matches.length > 0) {
      const twinProducts = twin.matches.map(twinToMatched);
      const byId = new Map<string, MatchedProduct>();
      for (const p of twinProducts) byId.set(p.id, p);
      for (const p of products) {
        if (!byId.has(p.id)) byId.set(p.id, p);
      }
      products = [...byId.values()].slice(0, 6);
      reply = `وجد توأم الأسلوب ${twin.matches.length} خيارات من المتاجر الحقيقية.`;
      reply_en = `Style Twin found ${twin.matches.length} real-store matches.`;
    }

    return NextResponse.json({
      ...response,
      reply,
      reply_en,
      products,
      styleTwin: twin
        ? {
            ok: twin.ok,
            blocked: twin.blocked,
            matches: twin.matches,
            dna: twin.dna,
            indexedCount: twin.indexedCount,
            error: twin.error,
            errorAr: twin.errorAr,
          }
        : undefined,
      context: {
        lastIntent: response.intent,
        selectedProductId: response.selectedProduct?.id ?? shoppingContext.selectedProductId,
        lastProducts: products.length ? products : shoppingContext.lastProducts,
        selectedSize: shoppingContext.selectedSize,
      },
    });
  } catch (err) {
    console.error("[concierge/chat]", err);
    return NextResponse.json({ error: "Concierge request failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-auth";
import { conciergeShoppingRespond } from "@/lib/ai/concierge-shopping";
import type { ConciergeShoppingContext } from "@/lib/ai/concierge-types";
import { callLLMWithVision, extractJsonFromLLM, isRealAIProvider } from "@/lib/ai/provider";
import { extractProductSearchIntent, type ProductSearchIntent } from "@/lib/ai/product-intent";
import { logAICall } from "@/lib/db/analytics";

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

    const response = await conciergeShoppingRespond(message, shoppingContext, user?.id ?? null);

    return NextResponse.json({
      ...response,
      context: {
        lastIntent: response.intent,
        selectedProductId: response.selectedProduct?.id ?? shoppingContext.selectedProductId,
        lastProducts: response.products.length ? response.products : shoppingContext.lastProducts,
        selectedSize: shoppingContext.selectedSize,
      },
    });
  } catch (err) {
    console.error("[concierge/chat]", err);
    return NextResponse.json({ error: "Concierge request failed" }, { status: 500 });
  }
}

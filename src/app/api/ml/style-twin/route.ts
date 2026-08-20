import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/api-auth";
import { runStyleTwin } from "@/lib/ml/style-twin";
import { countProductEmbeddings } from "@/lib/ml/product-embeddings-db";
import { isEmbeddingsConfigured } from "@/lib/ml/embeddings";
import { STYLE_TWIN_EMBEDDING_MODEL } from "@/lib/ml/types";

export async function GET() {
  const indexedCount = await countProductEmbeddings();
  return NextResponse.json({
    configured: isEmbeddingsConfigured(),
    model: STYLE_TWIN_EMBEDDING_MODEL,
    indexedCount,
  });
}

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in required", errorAr: "سجّل دخولك لاستخدام توأم الأسلوب" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      imageDataUrl?: string;
      text?: string;
      cityId?: string;
      limit?: number;
    };

    if (!body.imageDataUrl && !body.text?.trim()) {
      return NextResponse.json(
        { error: "Provide imageDataUrl or text", errorAr: "أرفق صورة أو وصفًا" },
        { status: 400 }
      );
    }

    const result = await runStyleTwin({
      imageDataUrl: body.imageDataUrl,
      text: body.text,
      cityId: body.cityId,
      limit: body.limit,
    });

    const status = result.blocked ? 503 : result.ok ? 200 : 422;
    return NextResponse.json(result, { status: result.ok ? 200 : status });
  } catch (err) {
    console.error("[ml/style-twin]", err);
    return NextResponse.json({ error: "Style Twin failed", ok: false, matches: [] }, { status: 500 });
  }
}

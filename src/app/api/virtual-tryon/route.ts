import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { getProductById } from "@/lib/db/products";
import { getAppearanceProfile } from "@/lib/db/appearance";
import { getMeasurementProfile } from "@/lib/db/measurements-pg";
import {
  createTryOnSession,
  updateTryOnSession,
  saveTryOnResult,
  getTryOnResultsForUser,
} from "@/lib/db/virtual-tryon-pg";
import { runVirtualTryOn, getTryOnProviderConfig } from "@/lib/ai/virtual-tryon";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const config = getTryOnProviderConfig();
  const results = await getTryOnResultsForUser(auth.id);

  return NextResponse.json({
    provider: config,
    results: results.map((r) => ({
      id: r.id,
      image_url: r.image_url,
      has_image_data: Boolean(r.image_data),
      provider: r.provider,
      model: r.model,
      created_at: r.created_at,
      metadata: r.metadata,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { productId, sizeLabel } = body as { productId?: string; sizeLabel?: string };

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const config = getTryOnProviderConfig();
  if (!config.configured) {
    return NextResponse.json(
      {
        status: "BLOCKED_BY_PROVIDER",
        message: "النظرة الافتراضية غير مفعلة حاليًا.",
        provider: config.provider,
        envKey: config.envKey,
        setupUrl: config.setupUrl,
        integration: "src/lib/ai/virtual-tryon.ts",
      },
      { status: 503 }
    );
  }

  const product = await getProductById(productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.image_url) {
    return NextResponse.json({ error: "Product has no image for try-on" }, { status: 400 });
  }

  const appearance = await getAppearanceProfile(auth.id);
  if (!appearance) {
    return NextResponse.json(
      {
        status: "MISSING_PROFILE_IMAGE",
        message: "أضف صورة لك للحصول على نظرة افتراضية.",
      },
      { status: 400 }
    );
  }

  const measurements = await getMeasurementProfile(auth.id);
  const sessionId = await createTryOnSession(auth.id, productId, measurements?.id ?? null);
  if (!sessionId) {
    return NextResponse.json({ error: "Could not create try-on session" }, { status: 500 });
  }

  await updateTryOnSession(sessionId, { status: "processing", provider: config.provider });

  const userImageDataUrl = appearance.image_data.startsWith("data:")
    ? appearance.image_data
    : `data:${appearance.mime_type};base64,${appearance.image_data}`;

  const tryOnResult = await runVirtualTryOn({
    userImageDataUrl,
    garmentImageUrl: product.image_url,
    garmentDescription: `${product.name_ar} ${product.fabric ?? ""} ${product.style ?? ""}`,
    userId: auth.id,
    productId,
  });

  if (tryOnResult.status === "BLOCKED_BY_PROVIDER") {
    await updateTryOnSession(sessionId, {
      status: "blocked",
      error_message: tryOnResult.blockedReason,
    });
    return NextResponse.json(
      {
        status: "BLOCKED_BY_PROVIDER",
        message: "النظرة الافتراضية غير مفعلة حاليًا.",
        detail: tryOnResult.blockedReason,
      },
      { status: 503 }
    );
  }

  if (tryOnResult.status === "error" || !tryOnResult.imageUrl) {
    await updateTryOnSession(sessionId, {
      status: "failed",
      error_message: tryOnResult.error,
    });
    return NextResponse.json({ status: "error", error: tryOnResult.error }, { status: 502 });
  }

  const saved = await saveTryOnResult(sessionId, auth.id, {
    image_url: tryOnResult.imageUrl,
    provider: tryOnResult.provider ?? "replicate",
    model: tryOnResult.model,
    latency_ms: tryOnResult.latencyMs,
    metadata: {
      product_id: productId,
      product_name: product.name_ar,
      size_label: sizeLabel,
      measurement_id: measurements?.id,
      request_id: tryOnResult.requestId,
    },
  });

  await updateTryOnSession(sessionId, { status: "completed" });

  return NextResponse.json({
    status: "success",
    sessionId,
    result: {
      id: saved?.id,
      image_url: tryOnResult.imageUrl,
      provider: tryOnResult.provider,
      model: tryOnResult.model,
      latency_ms: tryOnResult.latencyMs,
      disclaimer:
        "هذه معاينة بصرية تقريبية وليست ضمانًا للمقاس أو الشكل النهائي. لنتيجة أدق، أضف قياسات الجسم.",
      product: {
        name_ar: product.name_ar,
        fabric: product.fabric,
        size_label: sizeLabel,
        length: measurements?.dishdasha_length,
      },
    },
  });
}

import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { estimateMeasurements, type BodySex } from "@/lib/ai/measurement";
import { logAICall } from "@/lib/db/analytics";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const heightCm = Number(body.heightCm);
  const weightKg = body.weightKg != null ? Number(body.weightKg) : undefined;
  const sex = (body.sex as BodySex | undefined) ?? "unspecified";
  const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : undefined;

  if (!Number.isFinite(heightCm) || heightCm < 140 || heightCm > 210) {
    return NextResponse.json(
      {
        error: "HEIGHT_REQUIRED",
        errorAr: "أدخل طولك الحقيقي بالسنتيمتر (١٤٠–٢١٠) لمعايرة القياس.",
        errorEn: "Enter your real height in cm (140–210) to calibrate measurement.",
      },
      { status: 400 }
    );
  }

  const start = Date.now();
  try {
    const result = await estimateMeasurements({
      heightCm,
      weightKg: Number.isFinite(weightKg) ? weightKg : undefined,
      sex,
      imageDataUrl,
    });

    await logAICall({
      userId: auth.id,
      feature: "measurement",
      provider: result.usedVision ? "openrouter" : "rules",
      status: "success",
      latencyMs: Date.now() - start,
    });

    return NextResponse.json({
      ok: true,
      measurements: result.measurements,
      usedVision: result.usedVision,
      method: result.method,
      notes_ar: result.notes_ar,
      disclaimerAr:
        "تقدير معاير بطولك الحقيقي. أكّد المقاسات مع الخياط قبل القص — خاصة الصدر والخصر.",
      disclaimerEn:
        "Calibrated estimate from your confirmed height. Confirm with your tailor before cutting — especially chest and waist.",
    });
  } catch (e) {
    await logAICall({
      userId: auth.id,
      feature: "measurement",
      provider: "rules",
      status: "error",
      latencyMs: Date.now() - start,
    });
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "estimate_failed",
        errorAr: "تعذر تقدير المقاسات. أعد المحاولة أو أدخل يدويًا.",
      },
      { status: 500 }
    );
  }
}

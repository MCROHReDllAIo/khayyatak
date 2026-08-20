import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import {
  getSessionForCustomer,
  addDesignVersionFromSpec,
} from "@/lib/db/innovation";
import {
  applyMessageToSpec,
  analyzeInspirationImage,
  generateCollaborationReply,
} from "@/lib/ai/innovation-design";
import type { InnovationDesignSpec } from "@/lib/innovation/types";
import { logAICall } from "@/lib/db/analytics";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { sessionId } = await params;
  const body = await request.json();
  const { message, imageDataUrl, history } = body as {
    message: string;
    imageDataUrl?: string;
    history?: string[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const data = await getSessionForCustomer(sessionId, auth.id);
  if (!data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const start = Date.now();
  let spec: InnovationDesignSpec = { ...data.currentVersion.spec };
  let summaryAr = "تحديث من المحادثة";
  let summaryEn = "Chat update";
  let usedVision = false;

  if (imageDataUrl) {
    const vision = await analyzeInspirationImage(imageDataUrl, message);
    spec = { ...spec, ...vision.spec };
    usedVision = vision.usedRealAI;
    summaryAr = "تحليل صورة مرجعية";
    summaryEn = "Reference image analysis";
  }

  const patch = applyMessageToSpec(message, spec);
  spec = patch.spec as InnovationDesignSpec;

  if (!imageDataUrl) {
    summaryAr = patch.summary_ar;
    summaryEn = patch.summary_en;
  }

  const refs = imageDataUrl
    ? [...new Set([...(data.currentVersion.reference_images ?? []), imageDataUrl])]
    : data.currentVersion.reference_images;

  const version = await addDesignVersionFromSpec(sessionId, auth.id, spec, summaryAr, summaryEn, refs);
  const { reply, usedRealAI } = await generateCollaborationReply(message, spec, history ?? []);

  await logAICall({
    userId: auth.id,
    feature: "innovation_chat",
    provider: usedRealAI ? "openrouter" : "rules",
    status: "success",
    latencyMs: Date.now() - start,
  });

  return NextResponse.json({
    reply,
    spec,
    version,
    usedRealAI,
    usedVision,
    isDesignConcept: true,
    disclaimer: "تصميم مقترح بالذكاء الاصطناعي — ليس منتجًا متوفرًا. الخياط يحدد إمكانية التنفيذ.",
  });
}

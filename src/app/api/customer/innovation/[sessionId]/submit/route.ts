import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import {
  getSessionForCustomer,
  submitDesignRequest,
  notifyTailor,
  getTailorProfileId,
} from "@/lib/db/innovation";
import { summarizeForTailor } from "@/lib/ai/innovation-design";
import { buildExecutionSpecification } from "@/lib/innovation/types";
import { getMeasurementProfile } from "@/lib/db/measurements-pg";

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
  const { storeId, storeIds } = body as { storeId?: string; storeIds?: string[] };

  const data = await getSessionForCustomer(sessionId, auth.id);
  if (!data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const measurements = await getMeasurementProfile(auth.id);
  const aiSummary = await summarizeForTailor(data.currentVersion.spec);
  const specification = buildExecutionSpecification(
    data.currentVersion.spec,
    data.currentVersion.version_number,
    data.currentVersion.reference_images
  );

  const targets = storeIds?.length ? storeIds : storeId ? [storeId] : [];
  if (targets.length === 0) {
    return NextResponse.json({ error: "storeId or storeIds required" }, { status: 400 });
  }

  const requests = [];
  for (const sid of targets) {
    const req = await submitDesignRequest(
      auth.id,
      sessionId,
      sid,
      measurements?.id,
      aiSummary
    );
    if (req) {
      const profileId = await getTailorProfileId(sid);
      if (profileId) {
        await notifyTailor(profileId, req.id, data.currentVersion.spec.color + " " + data.currentVersion.spec.category);
      }
      requests.push(req);
    }
  }

  if (requests.length === 0) {
    return NextResponse.json({ error: "Could not submit request" }, { status: 500 });
  }

  return NextResponse.json({
    requests,
    specification,
    message: "تم إرسال طلب الابتكار للمتجر. بانتظار رد المتجر.",
    disclaimer: "ONLY THE TAILOR CAN CONFIRM feasibility.",
  });
}

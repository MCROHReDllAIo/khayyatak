import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { getSessionForCustomer } from "@/lib/db/innovation";
import { getVisualizationConfig, get3DPreviewStatus } from "@/lib/ai/innovation-visualization";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { sessionId } = await params;
  const data = await getSessionForCustomer(sessionId, auth.id);

  if (!data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...data,
    visualization: getVisualizationConfig(),
    preview3d: get3DPreviewStatus(),
  });
}

import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { getSessionForCustomer, addDesignVersionFromSpec } from "@/lib/db/innovation";
import { generateDesignVisualization, getVisualizationConfig } from "@/lib/ai/innovation-visualization";
import { pgQuery } from "@/lib/db/postgres";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth = await requireApiUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const config = getVisualizationConfig();
  if (!config.configured) {
    return NextResponse.json(
      {
        status: "BLOCKED_BY_PROVIDER",
        message: "معاينة AI غير مفعلة حاليًا.",
        ...config,
      },
      { status: 503 }
    );
  }

  const { sessionId } = await params;
  const data = await getSessionForCustomer(sessionId, auth.id);
  if (!data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const result = await generateDesignVisualization(data.currentVersion.spec, auth.id);

  if (result.status === "BLOCKED_BY_PROVIDER") {
    return NextResponse.json({ status: "BLOCKED_BY_PROVIDER", detail: result.blockedReason }, { status: 503 });
  }

  if (result.status === "error" || !result.imageUrl) {
    return NextResponse.json({ status: "error", error: result.error }, { status: 502 });
  }

  await pgQuery(
    `UPDATE custom_design_versions SET ai_visualization_url = $2 WHERE id = $1`,
    [data.currentVersion.id, result.imageUrl]
  );

  return NextResponse.json({
    status: "success",
    imageUrl: result.imageUrl,
    provider: result.provider,
    label: "AI Visualization — visual concept, not manufacturing guarantee",
    disclaimer: "هذه معاينة بصرية تقريبية وليست ضمانًا للمقاس أو الشكل النهائي.",
  });
}

export async function GET() {
  return NextResponse.json(getVisualizationConfig());
}

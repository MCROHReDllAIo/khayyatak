import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-auth";
import { getSessionForCustomer } from "@/lib/db/innovation";
import { checkMaterialAvailability, getTailorIdsFromMarketplace } from "@/lib/db/inventory-search";

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
  const { tailorIds, colorQuery, fabricQuery } = body as {
    tailorIds?: string[];
    colorQuery?: string;
    fabricQuery?: string;
  };

  const data = await getSessionForCustomer(sessionId, auth.id);
  if (!data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const spec = data.currentVersion.spec;
  const color = colorQuery ?? spec.color;
  const fabric = fabricQuery ?? spec.fabric;

  let storeIds = tailorIds ?? [];
  if (storeIds.length === 0) {
    const tailors = await getTailorIdsFromMarketplace(10);
    storeIds = tailors.map((t) => t.id);
  }

  const results = await checkMaterialAvailability(storeIds, color, fabric);

  return NextResponse.json({
    query: { color, fabric },
    disclaimer: "مطابقة اللون تقريبية — لا تضمن تطابقًا فعليًا للقماش.",
    results,
  });
}

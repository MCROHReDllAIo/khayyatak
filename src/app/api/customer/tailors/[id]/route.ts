import { NextResponse } from "next/server";
import { fetchTailorDetail } from "@/lib/db/tailors";
import { matchTailors } from "@/lib/ai/matching";
import type { DesignConfig } from "@/types";
import type { FashionIntent } from "@/lib/ai/intent";
import type { StyleDNA } from "@/lib/ai/style-dna";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const detail = await fetchTailorDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Tailor not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    let matchCriteria: Parameters<typeof matchTailors>[1] = { city_id: detail.tailor.city_id };

    const designRaw = searchParams.get("design");
    const intentRaw = searchParams.get("intent");
    const dnaRaw = searchParams.get("style_dna");

    if (designRaw) {
      try {
        matchCriteria = { ...matchCriteria, design: JSON.parse(designRaw) as DesignConfig };
      } catch {
        /* ignore */
      }
    }
    if (intentRaw) {
      try {
        matchCriteria = { ...matchCriteria, intent: JSON.parse(intentRaw) as FashionIntent };
      } catch {
        /* ignore */
      }
    }
    if (dnaRaw) {
      try {
        matchCriteria = { ...matchCriteria, styleDNA: JSON.parse(dnaRaw) as StyleDNA };
      } catch {
        /* ignore */
      }
    }

    const [match] = matchTailors([detail.tailor], matchCriteria);

    return NextResponse.json({
      tailor: detail.tailor,
      reviews: detail.reviews,
      match,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

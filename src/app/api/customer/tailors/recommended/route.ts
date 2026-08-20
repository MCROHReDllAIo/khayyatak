import { NextResponse } from "next/server";
import { fetchCities, fetchRecommendedTailors } from "@/lib/db/tailors";
import { buildMatchContextLabel } from "@/lib/ai/matching";
import type { DesignConfig } from "@/types";
import type { FashionIntent } from "@/lib/ai/intent";
import type { StyleDNA } from "@/lib/ai/style-dna";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      city_id?: string;
      design?: DesignConfig;
      intent?: FashionIntent;
      style_dna?: StyleDNA;
      favorite_tailor_ids?: string[];
      limit?: number;
    };

    const criteria = {
      city_id: body.city_id,
      design: body.design,
      intent: body.intent,
      styleDNA: body.style_dna,
      favoriteTailorIds: body.favorite_tailor_ids,
    };

    const [{ matches }, cities] = await Promise.all([
      fetchRecommendedTailors(criteria, body.limit ?? 6),
      fetchCities(),
    ]);

    const context = buildMatchContextLabel(criteria, "ar");

    return NextResponse.json({
      matches,
      cities,
      context_title_ar: context.title,
      context_title_en: buildMatchContextLabel(criteria, "en").title,
      context_subtitle_ar: context.subtitle,
      context_subtitle_en: buildMatchContextLabel(criteria, "en").subtitle,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed",
        matches: [],
        cities: [],
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get("city_id") ?? undefined;

  try {
    const [{ matches }, cities] = await Promise.all([
      fetchRecommendedTailors({ city_id: cityId }, 6),
      fetchCities(),
    ]);

    const context = buildMatchContextLabel({ city_id: cityId }, "ar");

    return NextResponse.json({
      matches,
      cities,
      context_title_ar: context.title,
      context_title_en: buildMatchContextLabel({ city_id: cityId }, "en").title,
      context_subtitle_ar: context.subtitle,
      context_subtitle_en: buildMatchContextLabel({ city_id: cityId }, "en").subtitle,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed",
        matches: [],
        cities: [],
      },
      { status: 500 }
    );
  }
}

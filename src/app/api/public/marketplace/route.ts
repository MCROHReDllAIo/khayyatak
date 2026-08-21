import { NextResponse } from "next/server";
import { fetchCities, fetchTailorRailItems } from "@/lib/db/tailors";
import {
  SHOWCASE_CITIES,
  SHOWCASE_STORES,
  shouldUseShowcaseStores,
} from "@/lib/showcase/demo-stores";
import type { Tailor } from "@/types";

export async function GET() {
  try {
    const [cities, items] = await Promise.all([fetchCities(), fetchTailorRailItems(undefined, 50)]);

    const mappedTailors: Tailor[] = items.map((t) => ({
      id: t.id,
      profile_id: t.profile_id,
      name_ar: t.name_ar,
      name_en: t.name_en,
      city_id: t.city_id,
      city: t.city,
      rating: t.rating,
      review_count: t.review_count,
      starting_price: t.starting_price,
      delivery_days: t.delivery_days,
      specializations: t.specializations,
      specializations_ar: t.specializations,
      verified: t.verified,
      cover_image: t.cover_image,
      description_ar: "",
      description_en: "",
      gallery: t.portfolio_preview ?? [],
      availability_status: t.availability_status,
    }));

    if (shouldUseShowcaseStores(mappedTailors.length)) {
      return NextResponse.json({
        tailors: SHOWCASE_STORES,
        cities: SHOWCASE_CITIES,
        showcase: true,
        message_ar: "متاجر تجريبية للمظهر — ليست حجوزات حقيقية",
        message_en: "Showcase stores for appearance — not real bookings",
      });
    }

    return NextResponse.json({ tailors: mappedTailors, cities, showcase: false });
  } catch (error) {
    // Still show showcase on failure so the home never looks empty during demos
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed",
      tailors: SHOWCASE_STORES,
      cities: SHOWCASE_CITIES,
      showcase: true,
    });
  }
}

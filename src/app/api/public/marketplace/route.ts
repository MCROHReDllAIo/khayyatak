import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Tailor, City } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();

    const [{ data: cities }, { data: tailors }] = await Promise.all([
      supabase.from("cities").select("*").order("name_ar"),
      supabase
        .from("tailors")
        .select("id, profile_id, name_ar, name_en, city_id, rating, review_count, starting_price, delivery_days, specializations, verified, cover_image, availability_status, description_ar, description_en, cities(name_ar, name_en)")
        .eq("verified", true)
        .order("rating", { ascending: false }),
    ]);

    const mappedTailors: Tailor[] = (tailors ?? []).map((t) => ({
      id: t.id,
      profile_id: t.profile_id,
      name_ar: t.name_ar,
      name_en: t.name_en,
      city_id: t.city_id,
      city: (t.cities as { name_ar?: string } | null)?.name_ar ?? "",
      rating: Number(t.rating ?? 0),
      review_count: t.review_count ?? 0,
      starting_price: Number(t.starting_price ?? 0),
      delivery_days: t.delivery_days ?? 3,
      specializations: t.specializations ?? [],
      specializations_ar: t.specializations ?? [],
      verified: t.verified ?? false,
      cover_image: t.cover_image ?? undefined,
      description_ar: t.description_ar ?? "",
      description_en: t.description_en ?? "",
      gallery: [],
      availability_status: t.availability_status ?? "accepting_orders",
    }));

    const mappedCities: City[] = (cities ?? []).map((c) => ({
      id: c.id,
      name_ar: c.name_ar,
      name_en: c.name_en,
      tailor_count: c.tailor_count ?? 0,
      lat: Number(c.lat ?? 0),
      lng: Number(c.lng ?? 0),
    }));

    return NextResponse.json({ tailors: mappedTailors, cities: mappedCities });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed", tailors: [], cities: [] },
      { status: 500 }
    );
  }
}

import { createClient } from "@/lib/supabase/server";
import { isPostgresConfigured, pgQuery } from "@/lib/db/postgres";
import type {
  City,
  Tailor,
  TailorAvailabilityStatus,
  TailorRailItem,
  TailorService,
  Review,
} from "@/types";
import { resolveStorageUrl } from "@/lib/tailors/constants";
import { matchRailItems, type MatchCriteria, DEFAULT_CITY_NAMES, findCityByName } from "@/lib/ai/matching";
import type { TailorMatch } from "@/types";

type TailorRow = Record<string, unknown>;

function mapCity(row: Record<string, unknown>): City {
  return {
    id: row.id as string,
    name_ar: row.name_ar as string,
    name_en: row.name_en as string,
    tailor_count: Number(row.tailor_count ?? 0),
    lat: Number(row.lat ?? 0),
    lng: Number(row.lng ?? 0),
  };
}

function mapTailorRow(
  t: TailorRow,
  portfolioPreview: string[] = []
): TailorRailItem {
  const city = t.cities as { name_ar?: string } | null;
  const cover = resolveStorageUrl(t.cover_image as string | undefined) ?? resolveStorageUrl(t.cover_image as string | undefined, "tailors");
  const preview = portfolioPreview.map((p) => resolveStorageUrl(p) ?? p).filter(Boolean) as string[];

  return {
    id: t.id as string,
    profile_id: t.profile_id as string,
    name_ar: t.name_ar as string,
    name_en: t.name_en as string,
    city_id: t.city_id as string,
    city: city?.name_ar ?? "",
    rating: Number(t.rating ?? 0),
    review_count: Number(t.review_count ?? 0),
    starting_price: Number(t.starting_price ?? 0),
    delivery_days: Number(t.delivery_days ?? 3),
    specializations: (t.specializations as string[]) ?? [],
    verified: Boolean(t.verified),
    cover_image: cover,
    availability_status: (t.availability_status as TailorAvailabilityStatus) ?? "accepting_orders",
    portfolio_preview: preview.length ? preview : cover ? [cover] : [],
  };
}

function mapFullTailor(t: TailorRow, gallery: string[], services: TailorService[]): Tailor {
  const city = t.cities as { name_ar?: string } | null;
  const cover = resolveStorageUrl(t.cover_image as string | undefined) ?? resolveStorageUrl(t.cover_image as string | undefined, "tailors");

  return {
    id: t.id as string,
    profile_id: t.profile_id as string,
    name_ar: t.name_ar as string,
    name_en: t.name_en as string,
    city_id: t.city_id as string,
    city: city?.name_ar ?? "",
    rating: Number(t.rating ?? 0),
    review_count: Number(t.review_count ?? 0),
    starting_price: Number(t.starting_price ?? 0),
    delivery_days: Number(t.delivery_days ?? 3),
    specializations: (t.specializations as string[]) ?? [],
    specializations_ar: (t.specializations as string[]) ?? [],
    verified: Boolean(t.verified),
    cover_image: cover,
    description_ar: (t.description_ar as string) ?? "",
    description_en: (t.description_en as string) ?? "",
    gallery: gallery.map((p) => resolveStorageUrl(p) ?? p).filter(Boolean) as string[],
    availability_status: (t.availability_status as TailorAvailabilityStatus) ?? "accepting_orders",
    services,
  };
}

async function getSupabaseSafe() {
  return createClient();
}

export async function fetchCities(): Promise<City[]> {
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data } = await supabase.from("cities").select("*").order("name_ar");
    return (data ?? []).map(mapCity);
  }

  if (isPostgresConfigured()) {
    const { rows } = await pgQuery<Record<string, unknown>>(
      `SELECT id, name_ar, name_en, tailor_count, lat, lng FROM cities ORDER BY name_ar`
    );
    return rows.map(mapCity);
  }

  return [];
}

async function fetchPortfolioPreviewMap(tailorIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!tailorIds.length) return map;

  const supabase = await getSupabaseSafe();
  if (!supabase) return map;

  const { data } = await supabase
    .from("tailor_portfolio")
    .select("tailor_id, storage_path, sort_order")
    .in("tailor_id", tailorIds)
    .order("sort_order", { ascending: true });

  for (const row of data ?? []) {
    const id = row.tailor_id as string;
    const paths = map.get(id) ?? [];
    if (paths.length < 3) paths.push(row.storage_path as string);
    map.set(id, paths);
  }

  return map;
}

export async function fetchTailorRailItems(cityId?: string, limit = 12): Promise<TailorRailItem[]> {
  const supabase = await getSupabaseSafe();
  if (supabase) {
    let query = supabase
      .from("tailors")
      .select("id, profile_id, name_ar, name_en, city_id, rating, review_count, starting_price, delivery_days, specializations, verified, cover_image, availability_status, cities(name_ar, name_en)")
      .eq("verified", true)
      .order("rating", { ascending: false })
      .limit(limit);

    if (cityId) query = query.eq("city_id", cityId);

    const { data: tailors } = await query;
    if (!tailors?.length) return [];

    const portfolioMap = await fetchPortfolioPreviewMap(tailors.map((t) => t.id as string));
    return tailors.map((t) => mapTailorRow(t as TailorRow, portfolioMap.get(t.id as string) ?? []));
  }

  if (isPostgresConfigured()) {
    const params: unknown[] = [];
    let sql = `
      SELECT t.id, t.profile_id, t.name_ar, t.name_en, t.city_id, t.rating, t.review_count,
             t.starting_price, t.delivery_days, t.specializations, t.verified, t.cover_image,
             t.availability_status, c.name_ar AS city_name_ar
      FROM tailors t
      LEFT JOIN cities c ON c.id = t.city_id
      WHERE t.verified = true
    `;
    if (cityId) {
      params.push(cityId);
      sql += ` AND t.city_id = $${params.length}`;
    }
    params.push(limit);
    sql += ` ORDER BY t.rating DESC LIMIT $${params.length}`;

    const { rows } = await pgQuery<Record<string, unknown>>(sql, params);
    return rows.map((t) =>
      mapTailorRow(
        {
          ...t,
          cities: t.city_name_ar ? { name_ar: t.city_name_ar } : null,
        } as TailorRow,
        []
      )
    );
  }

  return [];
}

export async function fetchRecommendedTailors(
  criteria: MatchCriteria,
  limit = 6
): Promise<{ matches: TailorMatch[]; items: TailorRailItem[] }> {
  const items = await fetchTailorRailItems(criteria.city_id, 24);
  const matches = matchRailItems(items, criteria).slice(0, limit);
  return { matches, items };
}

export async function fetchTailorDetail(id: string): Promise<{
  tailor: Tailor;
  reviews: Review[];
  match?: TailorMatch;
} | null> {
  const supabase = await getSupabaseSafe();
  if (!supabase) {
    if (!isPostgresConfigured()) return null;
    const { rows } = await pgQuery<Record<string, unknown>>(
      `SELECT t.*, c.name_ar AS city_name_ar
       FROM tailors t LEFT JOIN cities c ON c.id = t.city_id
       WHERE t.id = $1 LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;
    const t = rows[0];
    const { rows: services } = await pgQuery<Record<string, unknown>>(
      `SELECT id, name_ar, name_en, category, starting_price FROM tailor_services WHERE tailor_id = $1`,
      [id]
    ).catch(() => ({ rows: [] as Record<string, unknown>[] }));
    const { rows: reviews } = await pgQuery<Record<string, unknown>>(
      `SELECT id, tailor_id, rating, comment_ar, comment_en, created_at FROM reviews WHERE tailor_id = $1 ORDER BY created_at DESC LIMIT 8`,
      [id]
    ).catch(() => ({ rows: [] as Record<string, unknown>[] }));
    const tailor = mapFullTailor(
      { ...t, cities: t.city_name_ar ? { name_ar: t.city_name_ar } : null } as TailorRow,
      [],
      services.map((s) => ({
        id: s.id as string,
        name_ar: s.name_ar as string,
        name_en: (s.name_en as string) ?? undefined,
        category: (s.category as string) ?? undefined,
        starting_price: s.starting_price != null ? Number(s.starting_price) : undefined,
      }))
    );
    return {
      tailor,
      reviews: reviews.map((r) => ({
        id: r.id as string,
        tailor_id: r.tailor_id as string,
        customer_name: "عميل",
        rating: Number(r.rating ?? 0),
        comment_ar: (r.comment_ar as string) ?? "",
        comment_en: (r.comment_en as string) ?? "",
        created_at: String(r.created_at ?? ""),
      })),
    };
  }

  const [{ data: tailorRow }, { data: portfolio }, { data: services }, { data: reviews }] = await Promise.all([
    supabase
      .from("tailors")
      .select("*, cities(name_ar, name_en)")
      .eq("id", id)
      .eq("verified", true)
      .maybeSingle(),
    supabase
      .from("tailor_portfolio")
      .select("storage_path, sort_order")
      .eq("tailor_id", id)
      .order("sort_order", { ascending: true })
      .limit(12),
    supabase
      .from("tailor_services")
      .select("id, name_ar, name_en, category, starting_price")
      .eq("tailor_id", id)
      .order("starting_price", { ascending: true }),
    supabase
      .from("reviews")
      .select("id, tailor_id, rating, comment_ar, comment_en, created_at, customer_id")
      .eq("tailor_id", id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (!tailorRow) return null;

  const gallery = (portfolio ?? []).map((p) => p.storage_path as string);
  const mappedServices: TailorService[] = (services ?? []).map((s) => ({
    id: s.id as string,
    name_ar: s.name_ar as string,
    name_en: (s.name_en as string) ?? undefined,
    category: (s.category as string) ?? undefined,
    starting_price: s.starting_price != null ? Number(s.starting_price) : undefined,
  }));

  const tailor = mapFullTailor(tailorRow as TailorRow, gallery, mappedServices);

  const mappedReviews: Review[] = (reviews ?? []).map((r) => ({
    id: r.id as string,
    tailor_id: r.tailor_id as string,
    customer_name: "عميل",
    rating: Number(r.rating ?? 0),
    comment_ar: (r.comment_ar as string) ?? "",
    comment_en: (r.comment_en as string) ?? "",
    created_at: r.created_at as string,
  }));

  return { tailor, reviews: mappedReviews };
}

export async function fetchInitialTailorRailData(userCityId?: string | null): Promise<{
  cities: City[];
  matches: TailorMatch[];
  defaultCityId: string | null;
  defaultCityName: string;
}> {
  const cities = await fetchCities();
  let defaultCityId = userCityId ?? null;
  let defaultCityName: string = DEFAULT_CITY_NAMES.ar;

  if (!defaultCityId && cities.length) {
    const salalah = findCityByName(cities, DEFAULT_CITY_NAMES.en) ?? findCityByName(cities, DEFAULT_CITY_NAMES.ar);
    defaultCityId = salalah?.id ?? cities[0]?.id ?? null;
    defaultCityName = salalah?.name_ar ?? cities[0]?.name_ar ?? DEFAULT_CITY_NAMES.ar;
  } else if (defaultCityId) {
    defaultCityName = cities.find((c) => c.id === defaultCityId)?.name_ar ?? DEFAULT_CITY_NAMES.ar;
  }

  const { matches } = await fetchRecommendedTailors({ city_id: defaultCityId ?? undefined }, 6);

  return { cities, matches, defaultCityId, defaultCityName };
}

export async function resolveUserCityId(): Promise<string | null> {
  const supabase = await getSupabaseSafe();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("city_id")
    .eq("id", user.id)
    .maybeSingle();

  return (profile?.city_id as string) ?? null;
}

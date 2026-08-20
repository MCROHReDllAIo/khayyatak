import { CustomerHomeClient } from "./CustomerHomeClient";
import { fetchInitialTailorRailData, resolveUserCityId } from "@/lib/db/tailors";
import { buildMatchContextLabel } from "@/lib/ai/matching";

export default async function CustomerHome() {
  let initial = {
    matches: [] as Awaited<ReturnType<typeof fetchInitialTailorRailData>>["matches"],
    cities: [] as Awaited<ReturnType<typeof fetchInitialTailorRailData>>["cities"],
    defaultCityId: null as string | null,
    defaultCityName: "صلالة",
    contextTitleAr: "خياطوك",
    contextTitleEn: "Your tailors",
  };

  try {
    const userCityId = await resolveUserCityId();
    const data = await fetchInitialTailorRailData(userCityId);
    const context = buildMatchContextLabel({ city_id: data.defaultCityId ?? undefined }, "ar");
    initial = {
      matches: data.matches,
      cities: data.cities,
      defaultCityId: data.defaultCityId,
      defaultCityName: data.defaultCityName,
      contextTitleAr: context.title,
      contextTitleEn: buildMatchContextLabel({ city_id: data.defaultCityId ?? undefined }, "en").title,
    };
  } catch {
    /* Supabase not configured or empty — client rail will fetch */
  }

  return <CustomerHomeClient initial={initial} />;
}

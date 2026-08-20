import { NextResponse } from "next/server";
import { getRevenueAnalytics } from "@/lib/db/analytics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") ?? "gmv";
  const period = searchParams.get("period") ?? "30d";
  const data = await getRevenueAnalytics(tab, period);
  return NextResponse.json({ data });
}

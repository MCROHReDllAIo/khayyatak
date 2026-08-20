import { NextResponse } from "next/server";
import { pgQuery, isPostgresConfigured } from "@/lib/db/postgres";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServiceClient();
    if (supabase) {
      const { data } = await supabase.from("inventory").select("*").order("fabric_name_ar");
      return NextResponse.json({ items: data ?? [] });
    }

    if (!isPostgresConfigured()) {
      return NextResponse.json({ items: [] });
    }

    const { rows } = await pgQuery(`SELECT * FROM inventory ORDER BY fabric_name_ar`);
    return NextResponse.json({ items: rows });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

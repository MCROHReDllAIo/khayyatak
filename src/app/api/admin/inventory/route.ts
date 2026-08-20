import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServiceClient();
    if (!supabase) return NextResponse.json({ items: [] });
    const { data } = await supabase.from("inventory").select("*").order("fabric_name_ar");
    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed", items: [] },
      { status: 500 }
    );
  }
}

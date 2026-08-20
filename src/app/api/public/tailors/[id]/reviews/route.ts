import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("reviews")
      .select("rating, comment_ar, comment_en, customer_id, profiles(full_name)")
      .eq("tailor_id", id)
      .order("created_at", { ascending: false });

    const reviews = (data ?? []).map((r) => ({
      rating: r.rating,
      comment_ar: r.comment_ar ?? "",
      comment_en: r.comment_en ?? "",
      customer_name: (r.profiles as { full_name?: string } | null)?.full_name ?? "Customer",
    }));

    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

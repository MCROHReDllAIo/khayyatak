import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPostgresConfigured, pgQuery } from "@/lib/db/postgres";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    if (supabase) {
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
    }

    if (isPostgresConfigured()) {
      const { rows } = await pgQuery<{
        rating: number;
        comment_ar: string | null;
        comment_en: string | null;
        full_name: string | null;
      }>(
        `SELECT r.rating, r.comment_ar, r.comment_en, p.full_name
         FROM reviews r
         LEFT JOIN profiles p ON p.id = r.customer_id
         WHERE r.tailor_id = $1
         ORDER BY r.created_at DESC`,
        [id]
      );
      return NextResponse.json({
        reviews: rows.map((r) => ({
          rating: r.rating,
          comment_ar: r.comment_ar ?? "",
          comment_en: r.comment_en ?? "",
          customer_name: r.full_name ?? "Customer",
        })),
      });
    }

    return NextResponse.json({ reviews: [] });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

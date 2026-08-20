import { NextResponse } from "next/server";
import { pgQuery, isPostgresConfigured } from "@/lib/db/postgres";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServiceClient();
    if (supabase) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, full_name_ar, email, city_id, created_at, cities(name_ar)")
        .eq("role", "customer")
        .order("created_at", { ascending: false })
        .limit(100);
      const list = (data ?? []).map((p) => ({
        id: p.id,
        name: p.full_name_ar ?? p.full_name ?? p.email,
        city: (p.cities as { name_ar?: string } | null)?.name_ar ?? "—",
        email: p.email,
        orders: 0,
      }));
      return NextResponse.json({ customers: list });
    }

    if (!isPostgresConfigured()) {
      return NextResponse.json({ customers: [] });
    }

    const { rows } = await pgQuery<{
      id: string;
      full_name: string | null;
      full_name_ar: string | null;
      email: string;
      city_name: string | null;
      order_count: number;
    }>(
      `SELECT p.id, p.full_name, p.full_name_ar, p.email, c.name_ar AS city_name,
              COUNT(o.id)::int AS order_count
       FROM profiles p
       LEFT JOIN cities c ON c.id = p.city_id
       LEFT JOIN orders o ON o.customer_id = p.id
       WHERE p.role = 'customer'
       GROUP BY p.id, p.full_name, p.full_name_ar, p.email, c.name_ar
       ORDER BY p.created_at DESC
       LIMIT 100`
    );

    return NextResponse.json({
      customers: rows.map((p) => ({
        id: p.id,
        name: p.full_name_ar ?? p.full_name ?? p.email,
        city: p.city_name ?? "—",
        email: p.email,
        orders: Number(p.order_count ?? 0),
      })),
    });
  } catch {
    return NextResponse.json({ customers: [] });
  }
}

import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { getProfileById } from "@/lib/auth/postgres-auth";
import { isPostgresAuthEnabled } from "@/lib/auth/config";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export async function getApiUser(): Promise<Profile | null> {
  if (isPostgresAuthEnabled()) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const session = verifySession(token);
    if (!session) return null;
    const profile = await getProfileById(session.userId);
    if (!profile) return null;
    return {
      ...profile,
      full_name_ar: profile.full_name_ar ?? profile.full_name,
    };
  }

  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name ?? profile.email,
    full_name_ar: profile.full_name_ar ?? profile.full_name ?? profile.email,
    role: profile.role,
    city_id: profile.city_id ?? undefined,
    phone: profile.phone ?? undefined,
    avatar_url: profile.avatar_url ?? undefined,
    created_at: profile.created_at,
  };
}

export async function requireApiUser(): Promise<Profile | { error: string; status: number }> {
  const user = await getApiUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  return user;
}

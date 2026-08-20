"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isPostgresAuthEnabled } from "@/lib/auth/config";
import { signInWithPostgres, signUpWithPostgres, getProfileById } from "@/lib/auth/postgres-auth";
import { SESSION_COOKIE, signSession, verifySession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";

async function setPostgresSession(profile: { id: string; email: string; role: UserRole }) {
  const token = signSession({
    userId: profile.id,
    email: profile.email,
    role: profile.role,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function signInWithPassword(email: string, password: string) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { success: true };
  }

  if (isPostgresAuthEnabled()) {
    const result = await signInWithPostgres(email, password);
    if (result.error || !result.profile) return { error: result.error ?? "Login failed" };
    await setPostgresSession(result.profile);
    return { success: true };
  }

  return { error: "Auth is not configured" };
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = "customer"
) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    if (error) return { error: error.message };
    return { success: true, user: data.user };
  }

  if (isPostgresAuthEnabled()) {
    const result = await signUpWithPostgres(email, password, fullName, role);
    if (result.error || !result.profile) return { error: result.error ?? "Sign up failed" };
    await setPostgresSession(result.profile);
    return { success: true, user: { id: result.profile.id } };
  }

  return { error: "Auth is not configured" };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  if (isPostgresAuthEnabled()) {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  }
  redirect("/login");
}

export async function getSessionProfile() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*, cities(name_ar)")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name ?? profile.email,
      full_name_ar: profile.full_name_ar ?? profile.full_name ?? profile.email,
      role: profile.role as UserRole,
      city_id: profile.city_id ?? undefined,
      city: (profile.cities as { name_ar?: string } | null)?.name_ar,
      phone: profile.phone ?? undefined,
      avatar_url: profile.avatar_url ?? undefined,
      created_at: profile.created_at,
    };
  }

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

  return null;
}

export async function updateTailorVerification(
  tailorId: string,
  action: "verified" | "rejected" | "info_requested" | "pending",
  note?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const verified = action === "verified";
  const { error: updateError } = await supabase
    .from("tailors")
    .update({ verified, verification_status: action, updated_at: new Date().toISOString() })
    .eq("id", tailorId);

  if (updateError) return { error: updateError.message };

  await supabase.from("tailor_verification_actions").insert({
    tailor_id: tailorId,
    admin_id: user.id,
    action,
    note,
  });

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: `tailor_verification_${action}`,
    entity_type: "tailor",
    entity_id: tailorId,
    payload: { note },
  });

  const { data: tailor } = await supabase.from("tailors").select("profile_id").eq("id", tailorId).single();
  if (tailor?.profile_id) {
    await supabase.from("notifications").insert({
      user_id: tailor.profile_id,
      title_ar: action === "verified" ? "تم توثيق حسابك" : "تحديث التحقق",
      title_en: action === "verified" ? "Account verified" : "Verification update",
      message_ar: note ?? `حالة التحقق: ${action}`,
      message_en: note ?? `Verification status: ${action}`,
    });
  }

  return { success: true };
}

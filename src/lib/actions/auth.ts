"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isPostgresAuthEnabled } from "@/lib/auth/config";
import { signInWithPostgres, signUpWithPostgres, getProfileById } from "@/lib/auth/postgres-auth";
import { SESSION_COOKIE, signSession, verifySession } from "@/lib/auth/session";
import { sessionCookieOptions } from "@/lib/auth/cookies";
import { pgQuery } from "@/lib/db/postgres";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";

async function setPostgresSession(profile: { id: string; email: string; role: UserRole }) {
  const token = signSession({
    userId: profile.id,
    email: profile.email,
    role: profile.role,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function signInWithPassword(email: string, password: string) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (!supabase) return { error: "Auth is not configured" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const profile = await getSessionProfile();
    return { success: true, role: profile?.role };
  }

  if (isPostgresAuthEnabled()) {
    const result = await signInWithPostgres(email, password);
    if (result.error || !result.profile) return { error: result.error ?? "Login failed" };
    await setPostgresSession(result.profile);
    return { success: true, role: result.profile.role };
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
    if (!supabase) return { error: "Auth is not configured" };
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
    if (supabase) await supabase.auth.signOut();
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
    if (!supabase) return null;
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
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (!supabase) return { error: "Unauthorized" };
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

  if (isPostgresAuthEnabled()) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return { error: "Unauthorized" };
    const session = verifySession(token);
    if (!session) return { error: "Unauthorized" };

    const profile = await getProfileById(session.userId);
    if (profile?.role !== "admin") return { error: "Forbidden" };

    const verified = action === "verified";
    try {
      await pgQuery(
        `UPDATE tailors
         SET verified = $1, verification_status = $2::verification_status, updated_at = NOW()
         WHERE id = $3`,
        [verified, action, tailorId]
      );

      await pgQuery(
        `INSERT INTO tailor_verification_actions (tailor_id, admin_id, action, note)
         VALUES ($1, $2, $3::verification_status, $4)`,
        [tailorId, session.userId, action, note ?? null]
      ).catch(() => undefined);

      await pgQuery(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, payload)
         VALUES ($1, $2, 'tailor', $3, $4::jsonb)`,
        [session.userId, `tailor_verification_${action}`, tailorId, JSON.stringify({ note })]
      ).catch(() => undefined);

      const { rows } = await pgQuery<{ profile_id: string | null }>(
        `SELECT profile_id FROM tailors WHERE id = $1 LIMIT 1`,
        [tailorId]
      );
      const profileId = rows[0]?.profile_id;
      if (profileId) {
        await pgQuery(
          `INSERT INTO notifications (user_id, title_ar, title_en, message_ar, message_en)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            profileId,
            action === "verified" ? "تم توثيق حسابك" : "تحديث التحقق",
            action === "verified" ? "Account verified" : "Verification update",
            note ?? `حالة التحقق: ${action}`,
            note ?? `Verification status: ${action}`,
          ]
        ).catch(() => undefined);
      }

      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Update failed" };
    }
  }

  return { error: "Unauthorized" };
}

import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AuthProviderKind = "supabase" | "postgres" | "none";

export function isPostgresAuthEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim()) && !isSupabaseConfigured();
}

export function getAuthProvider(): AuthProviderKind {
  if (isSupabaseConfigured()) return "supabase";
  if (isPostgresAuthEnabled()) return "postgres";
  return "none";
}

export function isAuthConfigured(): boolean {
  return getAuthProvider() !== "none";
}

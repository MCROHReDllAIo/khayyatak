import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig, getSupabaseServiceRoleKey } from "./env";

export async function createClient() {
  const { url, anonKey, valid } = getSupabasePublicConfig();
  if (!valid) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (run: npm run setup:supabase)."
    );
  }
  const key = anonKey;

  const cookieStore = await cookies();

  return createServerClient(url!, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* Server Component — ignore */
        }
      },
    },
  });
}

export async function createServiceClient() {
  const { url, valid } = getSupabasePublicConfig();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!valid || !url || !serviceKey) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
  }
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

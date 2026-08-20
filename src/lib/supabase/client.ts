import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./env";

export { isSupabaseConfigured } from "./env";

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const { url, anonKey, valid } = getSupabasePublicConfig();
  if (!valid) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}

export function createClient() {
  return getBrowserSupabase();
}

const PLACEHOLDER_MARKERS = [
  "your-project.supabase.co",
  "your_anon_key",
  "your_service_role_key",
  "your-publishable-key",
  "public-anon-key",
];

function isPlaceholder(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return true;
  return PLACEHOLDER_MARKERS.some((marker) => v.includes(marker));
}

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  const valid =
    Boolean(url && anonKey) &&
    url.startsWith("https://") &&
    url.includes(".supabase.co") &&
    !isPlaceholder(url) &&
    !isPlaceholder(anonKey) &&
    anonKey.startsWith("eyJ");

  return { url, anonKey, valid };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig().valid;
}

export function getSupabaseServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!key || isPlaceholder(key) || !key.startsWith("eyJ")) return null;
  return key;
}

/**
 * Resolve Supabase storage paths to public URLs.
 */
export function resolveStorageUrl(path: string | null | undefined, bucket = "portfolio"): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return undefined;
  const normalized = path.replace(/^\//, "");
  return `${base}/storage/v1/object/public/${bucket}/${normalized}`;
}

export const AVAILABILITY_LABELS: Record<
  import("@/types").TailorAvailabilityStatus,
  { ar: string; en: string; dot: string }
> = {
  available_now: { ar: "متاح الآن", en: "Available now", dot: "bg-emerald-500" },
  accepting_orders: { ar: "يستقبل طلبات", en: "Accepting orders", dot: "bg-primary" },
  busy: { ar: "مشغول", en: "Busy", dot: "bg-amber-500" },
  paused: { ar: "متوقف مؤقتًا", en: "Temporarily paused", dot: "bg-muted-foreground" },
};

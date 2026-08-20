/**
 * Product image trust rules — marketplace must never show stock/fake photos as real products.
 */

const BLOCKED_HOST_FRAGMENTS = [
  "images.unsplash.com",
  "unsplash.com",
  "images.pexels.com",
  "pexels.com",
  "loremflickr.com",
  "placehold.co",
  "placeholder.com",
  "via.placeholder.com",
  "picsum.photos",
];

export type ImageSourceType =
  | "TAILOR_UPLOAD"
  | "CUSTOMER_UPLOAD"
  | "AI_GENERATED"
  | "SYSTEM_ASSET"
  | "THREE_D_RENDER"
  | "UNKNOWN"
  | "BLOCKED_STOCK";

/** Returns true only if URL is acceptable as a real product photo (not stock/fake hosts). */
export function isTrustedProductImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const u = url.trim().toLowerCase();
  if (u.startsWith("data:")) return false; // never use inline data as catalog photo in listings
  if (BLOCKED_HOST_FRAGMENTS.some((h) => u.includes(h))) return false;
  return u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/");
}

/** Safe display URL — null when missing or blocked stock. */
export function resolveProductImageUrl(url: string | null | undefined): string | null {
  return isTrustedProductImageUrl(url) ? url!.trim() : null;
}

export function detectImageSourceType(
  url: string | null | undefined,
  explicit?: ImageSourceType | null
): ImageSourceType {
  if (explicit) return explicit;
  if (!url?.trim()) return "UNKNOWN";
  if (!isTrustedProductImageUrl(url)) return "BLOCKED_STOCK";
  return "UNKNOWN";
}

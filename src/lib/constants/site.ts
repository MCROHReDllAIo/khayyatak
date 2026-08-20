/** Public site URL — kytk.online */
export const SITE = {
  domain: "kytk.online",
  productionUrl: "https://kytk.online",
} as const;

export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return SITE.productionUrl;
}

export function getSiteOrigin(): URL {
  return new URL(getAppUrl());
}

/** Interactive garment regions for Innovation Studio (WebGL 3D part picks). */

export type GarmentPart =
  | "sleeve"
  | "shoulder"
  | "chest"
  | "waist"
  | "hem"
  | "embroidery";

export const GARMENT_PARTS: Array<{
  id: GarmentPart;
  ar: string;
  en: string;
  /** Approximate hotspot center in viewBox 0 0 200 320 */
  cx: number;
  cy: number;
}> = [
  { id: "shoulder", ar: "كتف", en: "Shoulder", cx: 100, cy: 78 },
  { id: "chest", ar: "صدر", en: "Chest", cx: 100, cy: 118 },
  { id: "sleeve", ar: "كم", en: "Sleeve", cx: 28, cy: 165 },
  { id: "waist", ar: "خصر", en: "Waist", cx: 100, cy: 190 },
  { id: "embroidery", ar: "نقشة", en: "Embroidery", cx: 100, cy: 105 },
  { id: "hem", ar: "أسفل", en: "Hem", cx: 100, cy: 295 },
];

export function garmentPartLabel(part: GarmentPart, locale: "ar" | "en"): string {
  const row = GARMENT_PARTS.find((p) => p.id === part);
  return locale === "ar" ? (row?.ar ?? part) : (row?.en ?? part);
}

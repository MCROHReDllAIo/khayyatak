import { PresentationEntry } from "./PresentationEntry";

import { brandTitle, BRAND } from "@/lib/constants/brand";

export const metadata = {
  title: `${brandTitle("ar")} — Hackathon Pitch`,
  description: `Competition pitch presentation for ${BRAND.nameEn}`,
};

export default function PresentationPage() {
  return <PresentationEntry />;
}

"use client";

import dynamic from "next/dynamic";

const PitchDeck = dynamic(
  () => import("@/components/presentation/PitchDeck").then((m) => m.PitchDeck),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071A33] text-white">
        <div className="text-center space-y-3">
          <p className="text-[#C8A45D] text-xs font-bold uppercase tracking-[0.3em] font-arabic">خياطك</p>
          <p className="text-white/60 text-sm">Loading pitch deck...</p>
        </div>
      </div>
    ),
  }
);

export function PresentationEntry() {
  return <PitchDeck />;
}

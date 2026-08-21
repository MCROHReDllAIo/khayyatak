"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { City, TailorMatch } from "@/types";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth, useAppState } from "@/lib/context/app-context";
import { buildStyleDNA } from "@/lib/ai/style-dna";
import { extractFashionIntent, intentToDesignConfig } from "@/lib/ai/intent";
import type { FashionIntent } from "@/lib/ai/intent";
import { ConciergeInput } from "@/components/ai/ConciergeInput";
import { TailorDiscoveryRail } from "@/components/customer/TailorDiscoveryRail";
import { StyleDNAView } from "@/components/customer/StyleDNAView";
import { GarmentPreview } from "@/components/designer/GarmentPreview";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { BRAND } from "@/lib/constants/brand";
import { OrderTimeline } from "@/components/customer/OrderTimeline";
import { getOrderTimeline } from "@/lib/utils";

export interface CustomerHomeInitialData {
  matches: TailorMatch[];
  cities: City[];
  defaultCityId: string | null;
  defaultCityName: string;
  contextTitleAr: string;
  contextTitleEn: string;
}

export function CustomerHomeClient({ initial }: { initial: CustomerHomeInitialData }) {
  const { t } = useLocale();
  const { user } = useAuth();
  const { design, setDesign, orders, styleEvents, favoriteTailorIds } = useAppState();

  const [conciergeIntent, setConciergeIntent] = useState<FashionIntent | null>(null);

  const activeOrder = orders.find((o) => o.status !== "delivered");
  const dna = buildStyleDNA(orders, design, styleEvents, favoriteTailorIds);
  const firstName = user?.full_name_ar?.split(" ")[0] ?? "عبدالله";

  const handleConciergeSubmit = useCallback(
    (text: string) => {
      const intent = extractFashionIntent(text);
      setConciergeIntent(intent);
      setDesign(intentToDesignConfig(intent, design));
    },
    [design, setDesign]
  );

  return (
    <div className="relative -mx-4 md:-mx-0">
      <section
        className="relative overflow-hidden bg-navy text-white px-4 py-10 md:py-14 md:rounded-3xl md:mx-0"
        data-tour="customer-hero"
      >
        <GeometricPattern className="text-white opacity-30" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-omani-gold mb-4"
            >
              {t(BRAND.nameAr, BRAND.nameEn)}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3"
            >
              {t(`مرحبًا، ${firstName}`, `Welcome, ${user?.full_name?.split(" ")[0] ?? "Abdullah"}`)}
            </motion.h1>
            <p className="text-white/60 text-base md:text-lg">
              {t("ماذا تريد أن ترتدي اليوم؟", "What would you like to wear today?")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.85fr)_minmax(280px,1fr)] gap-6 lg:gap-8 items-start">
            <div className="min-w-0 order-1" data-tour="customer-concierge">
              <ConciergeInput variant="hero" onSubmit={handleConciergeSubmit} />
              <p className="mt-3 text-center lg:text-start text-xs text-white/40 hidden sm:block">
                {t("AI → تصميم → خياط", "AI → Design → Tailor")}
              </p>
            </div>

            <div className="min-w-0 order-2 lg:sticky lg:top-24" data-tour="customer-tailors">
              <TailorDiscoveryRail
                design={design}
                intent={conciergeIntent}
                styleDNA={dna}
                initialMatches={initial.matches}
                initialCities={initial.cities}
                initialCityId={initial.defaultCityId}
                initialCityName={initial.defaultCityName}
                initialContextTitleAr={initial.contextTitleAr}
                initialContextTitleEn={initial.contextTitleEn}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 space-y-16 md:space-y-24">
        <section data-tour="customer-design">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">
                {t("تصميمك الحالي (توضيحي)", "Your current design (concept)")}
              </p>
              <h2 className="editorial-title">
                {design.color} · {design.fabric}
              </h2>
            </div>
            <Link
              href="/customer/designer"
              className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {t("فتح الاستوديو", "Open studio")}
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
          <div className="grid md:grid-cols-[1fr_280px] gap-8 items-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex justify-center py-8 md:py-12 bg-omani-cream/60 rounded-3xl border border-border/30"
            >
              <GarmentPreview design={design} size="lg" />
            </motion.div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {design.collar} · {design.embroidery}
              </p>
              <Link
                href="/customer/designer"
                className="md:hidden inline-flex w-full justify-center items-center gap-2 rounded-xl bg-navy py-3 text-sm font-medium text-white"
              >
                {t("تعديل التصميم", "Edit design")}
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">Style DNA</p>
            <h2 className="editorial-title">{t("ذوقك في قطعة واحدة", "Your taste, distilled")}</h2>
          </div>
          <StyleDNAView dna={dna} />
          <Link href="/customer/style-dna" className="inline-block mt-4 text-sm text-primary hover:underline">
            {t("عرض الملف الكامل →", "View full profile →")}
          </Link>
        </section>

        <section className="fashion-divider pt-16">
          <div className="flex items-start gap-4 mb-6">
            <Sparkles className="h-5 w-5 text-omani-gold shrink-0 mt-1" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                AI Recommendation
              </p>
              <p className="text-xl md:text-2xl font-medium text-navy leading-snug max-w-2xl">
                {conciergeIntent?.summary_ar
                  ? t(
                      `بناءً على طلبك — ${conciergeIntent.summary_ar}`,
                      `Based on your request — ${conciergeIntent.summary_en}`
                    )
                  : t(
                      "صف ما تريده في المساعد أعلاه — وسنعرض أفضل الخياطين فورًا.",
                      "Describe what you want in the concierge above — we'll show the best tailors instantly."
                    )}
              </p>
            </div>
          </div>
        </section>

        {activeOrder && (
          <section className="fashion-divider pt-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-2">
              {t("طلبك الحالي", "Current order")}
            </p>
            <h2 className="editorial-title mb-8">#{activeOrder.id.slice(-6)}</h2>
            <OrderTimeline steps={getOrderTimeline(activeOrder.status, activeOrder.created_at)} />
            <Link
              href={`/customer/orders/${activeOrder.id}`}
              className="inline-block mt-6 text-sm text-primary hover:underline"
            >
              {t("تفاصيل الطلب →", "Order details →")}
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

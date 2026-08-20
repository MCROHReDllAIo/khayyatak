"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/context/locale-context";
import { BRAND } from "@/lib/constants/brand";
import { Button } from "@/components/ui/button";

const STEPS = [
  { ar: "تحدث مع مساعد AI", en: "Chat with AI Concierge", href: "/customer/ai" },
  { ar: "صمّم في الاستوديو", en: "Design in AI Studio", href: "/customer/designer" },
  { ar: "حلّل صورة إلهام", en: "Analyze inspiration image", href: "/customer/image-ai" },
  { ar: "قياسات AI", en: "AI measurements", href: "/customer/measurements" },
  { ar: "Style DNA + المطابقة", en: "Style DNA + matching", href: "/customer/match" },
  { ar: "مواصفات الخياط", en: "Tailor specification", href: "/customer/specification" },
  { ar: BRAND.aiAssistantAr, en: BRAND.aiAssistantEn, href: "/tailor/ai" },
  { ar: "AI Control Center", en: "AI Control Center", href: "/ai-control-center" },
];

export function DemoGuide() {
  const [open, setOpen] = useState(false);
  const { t, locale } = useLocale();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 start-4 z-50 flex items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-navy-light transition-colors md:bottom-6"
      >
        <Map className="h-4 w-4" />
        {t("دليل العرض", "Demo Guide")}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-premium"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-navy">
                  {t("دليل العرض التجريبي", "Demo Guide")}
                </h3>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                {STEPS.map((step, i) => (
                  <Link key={i} href={step.href} onClick={() => setOpen(false)}>
                    <div className="flex items-center gap-3 rounded-xl border p-3 hover:bg-omani-cream/50 transition-colors">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="flex-1 font-medium">
                        {locale === "ar" ? step.ar : step.en}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                    </div>
                  </Link>
                ))}
              </div>
              <Button className="w-full mt-4" onClick={() => setOpen(false)}>
                {t("إغلاق", "Close")}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

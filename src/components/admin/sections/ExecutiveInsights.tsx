"use client";

import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import type { ExecutiveInsight } from "@/lib/admin/types";
import { useLocale } from "@/lib/context/locale-context";

export function ExecutiveInsights({ insights }: { insights: ExecutiveInsight[] }) {
  const { t } = useLocale();

  return (
    <section className="rounded-3xl border border-primary/10 bg-gradient-to-br from-navy via-navy to-navy-light p-6 md:p-8 text-white shadow-premium">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-omani-gold mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs uppercase tracking-widest font-semibold">AI Executive Insights</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">{t("رؤى تنفيذية بالذكاء الاصطناعي", "AI Executive Insights")}</h2>
          <p className="text-white/60 text-sm mt-1">{t("قرارات مقترحة بناءً على بيانات المنصة.", "Suggested decisions from platform data.")}</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-1 rounded-full">
          {t("بيانات حية", "Live data")}
        </span>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {insights.map((insight, i) => (
          <div
            key={insight.id}
            className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors backdrop-blur-sm"
          >
            <p className="text-omani-gold text-xs font-bold mb-2">Insight {String(i + 1).padStart(2, "0")}</p>
            <h3 className="font-bold text-lg mb-2">{t(insight.title_ar, insight.title_en)}</h3>
            <p className="text-sm text-white/70 leading-relaxed mb-4">{t(insight.message_ar, insight.message_en)}</p>
            <Link
              href={insight.href}
              className="inline-flex items-center gap-1 text-sm text-omani-gold hover:text-white transition-colors"
            >
              {t(insight.action_ar, insight.action_en)}
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

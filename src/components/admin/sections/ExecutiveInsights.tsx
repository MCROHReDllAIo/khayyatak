"use client";

import Link from "next/link";
import { Sparkles, ArrowLeft, Zap } from "lucide-react";
import type { ExecutiveInsight } from "@/lib/admin/types";
import { useLocale } from "@/lib/context/locale-context";

export function ExecutiveInsights({ insights }: { insights: ExecutiveInsight[] }) {
  const { t } = useLocale();

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-navy via-[#0c2340] to-[#0f7654]/40 p-6 md:p-8 text-white shadow-[0_28px_70px_-40px_rgba(7,26,51,0.8)]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-omani-gold">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">AI Executive Insights</span>
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">
            {t("رؤى تنفيذية بالذكاء الاصطناعي", "AI Executive Insights")}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            {t("قرارات مقترحة من بيانات المنصة الحقيقية وحالة الجاهزية.", "Decisions from live platform data and readiness state.")}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-wider">
          <Zap className="h-3 w-3 text-omani-gold" />
          {t("بيانات حية", "Live data")}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight, i) => (
          <div
            key={insight.id}
            className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition-colors hover:bg-white/[0.1]"
          >
            <p className="mb-2 text-xs font-bold text-omani-gold">
              Insight {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mb-2 text-lg font-bold">{t(insight.title_ar, insight.title_en)}</h3>
            <p className="mb-4 text-sm leading-relaxed text-white/70">
              {t(insight.message_ar, insight.message_en)}
            </p>
            <Link
              href={insight.href}
              className="inline-flex items-center gap-1 text-sm text-omani-gold transition-colors hover:text-white"
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

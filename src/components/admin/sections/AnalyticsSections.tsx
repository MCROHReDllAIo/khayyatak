"use client";

import { Trophy, Star } from "lucide-react";
import type { TopTailorRow, CustomerIntelData, FashionTrendsData } from "@/lib/admin/types";
import LinkNext from "next/link";
import { useLocale } from "@/lib/context/locale-context";
import { formatOMR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TopTailorsSection({ tailors }: { tailors: TopTailorRow[] }) {
  const { t } = useLocale();

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6 text-omani-gold" />
        <h2 className="text-2xl font-bold text-navy">{t("أفضل الخياطين", "Top Tailors")}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="py-3 pe-3 text-start">#</th>
              <th className="py-3 pe-3 text-start">{t("الخياط", "Tailor")}</th>
              <th className="py-3 pe-3 text-start hidden sm:table-cell">{t("المدينة", "City")}</th>
              <th className="py-3 pe-3 text-start">{t("الطلبات", "Orders")}</th>
              <th className="py-3 pe-3 text-start">{t("التقييم", "Rating")}</th>
              <th className="py-3 pe-3 text-start hidden md:table-cell">{t("الإيراد", "Revenue")}</th>
              <th className="py-3 pe-3 text-start hidden lg:table-cell">{t("إعادة الطلب", "Repeat")}</th>
              <th className="py-3 text-start hidden lg:table-cell">AI Match</th>
            </tr>
          </thead>
          <tbody>
            {tailors.map((tailor) => (
              <tr key={tailor.id} className="border-b border-border/30 hover:bg-muted/20">
                <td className="py-3 pe-3">
                  <span className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    tailor.rank === 1 ? "bg-omani-gold/20 text-amber-800" : "bg-muted text-navy"
                  )}>
                    {tailor.rank}
                  </span>
                </td>
                <td className="py-3 pe-3">
                  <LinkNext href={`/admin/tailors?id=${tailor.id}`} className="font-medium text-navy hover:text-primary">
                    {tailor.name_ar}
                  </LinkNext>
                </td>
                <td className="py-3 pe-3 hidden sm:table-cell text-muted-foreground">{tailor.city}</td>
                <td className="py-3 pe-3 font-semibold">{tailor.orders}</td>
                <td className="py-3 pe-3">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-omani-gold text-omani-gold" />
                    {tailor.rating}
                  </span>
                </td>
                <td className="py-3 pe-3 hidden md:table-cell">{formatOMR(tailor.revenue)}</td>
                <td className="py-3 pe-3 hidden lg:table-cell">{tailor.repeatRate}%</td>
                <td className="py-3 hidden lg:table-cell text-primary font-medium">{tailor.matchSuccess}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CustomerIntelligenceSection({ data }: { data: CustomerIntelData }) {
  const { t } = useLocale();

  const metrics = [
    { label_ar: "إجمالي العملاء", label_en: "Total", value: data.total.toLocaleString(), href: "/admin/customers" },
    { label_ar: "عملاء جدد", label_en: "New", value: data.new.toLocaleString(), href: "/admin/customers?segment=new" },
    { label_ar: "عائدون", label_en: "Returning", value: data.returning.toLocaleString(), href: "/admin/customers?segment=returning" },
    { label_ar: "قيمة عالية", label_en: "High Value", value: data.highValue.toLocaleString(), href: "/admin/customers?segment=high" },
    { label_ar: "معرضون للخطر", label_en: "At Risk", value: data.atRisk.toLocaleString(), href: "/admin/customers?segment=at-risk" },
    { label_ar: "محتمل إعادة الطلب", label_en: "Likely Reorder", value: data.likelyReorder.toLocaleString(), href: "/admin/customers?segment=reorder" },
  ];

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6 md:p-8">
      <h2 className="text-2xl font-bold text-navy mb-6">{t("ذكاء العملاء", "Customer Intelligence")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {metrics.map((m) => (
          <LinkNext key={m.label_en} href={m.href} className="rounded-xl border p-4 hover:border-primary hover:shadow-md transition-all">
            <p className="text-2xl font-bold text-navy">{m.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{t(m.label_ar, m.label_en)}</p>
          </LinkNext>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-navy mb-3">{t("شرائح العملاء", "Customer Segments")}</p>
        {data.segments.map((seg) => (
          <LinkNext
            key={seg.id}
            href={`/admin/customers?segment=${seg.id}`}
            className="flex items-center gap-3 group"
          >
            <span className="text-xs w-24 text-muted-foreground">{t(seg.label_ar, seg.label_en)}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full group-hover:bg-navy transition-colors" style={{ width: `${seg.pct}%` }} />
            </div>
            <span className="text-xs font-semibold text-navy w-16 text-end">{seg.count.toLocaleString()}</span>
          </LinkNext>
        ))}
      </div>
    </section>
  );
}

export function FashionTrendsSection({ trends }: { trends: FashionTrendsData }) {
  const { t } = useLocale();

  const groups = [
    { title_ar: "أعلى الألوان", title_en: "Top Colors", items: trends.colors },
    { title_ar: "أعلى الأقمشة", title_en: "Top Fabrics", items: trends.fabrics },
    { title_ar: "أعلى الملابس", title_en: "Top Garments", items: trends.garments },
    { title_ar: "التطريز", title_en: "Embroidery", items: trends.embroidery },
    { title_ar: "الأنماط", title_en: "Styles", items: trends.styles },
  ];

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6 md:p-8">
      <h2 className="text-2xl font-bold text-navy mb-2">{t("اتجاهات الموضة", "Fashion Trends")}</h2>
      <p className="text-xs text-muted-foreground mb-6">{!trends.hasData ? t("لا توجد بيانات كافية", "Insufficient data") : ""}</p>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div key={group.title_en}>
            <h3 className="font-semibold text-navy mb-3 text-sm">{t(group.title_ar, group.title_en)}</h3>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-sm w-20 truncate">{item.name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-omani-gold rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-primary w-10">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

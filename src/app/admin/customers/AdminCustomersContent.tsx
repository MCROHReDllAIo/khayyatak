"use client";

import { useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";

const DEMO_CUSTOMERS = Array.from({ length: 10 }, (_, i) => ({
  name: ["عبدالله البلوشي", "سالم الحارثي", "محمد الشحي", "خالد المعمري", "فهد الرواحي"][i % 5],
  city: ["مسقط", "صلالة", "نزوى", "صحار", "صور"][i % 5],
  orders: [3, 7, 2, 9, 5, 4, 8, 1, 6, 10][i],
  segment: (["new", "active", "returning", "high", "inactive"] as const)[i % 5],
}));

const SEGMENT_LABELS: Record<string, { ar: string; en: string }> = {
  new: { ar: "عملاء جدد", en: "New Customers" },
  returning: { ar: "عملاء عائدون", en: "Returning Customers" },
  high: { ar: "قيمة عالية", en: "High Value" },
  "at-risk": { ar: "معرضون للخطر", en: "At Risk" },
  reorder: { ar: "محتمل إعادة الطلب", en: "Likely Reorder" },
  active: { ar: "نشطون", en: "Active" },
  inactive: { ar: "غير نشط", en: "Inactive" },
};

export default function AdminCustomersContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const segment = searchParams.get("segment");

  const customers = segment
    ? DEMO_CUSTOMERS.filter((c) => c.segment === segment || (segment === "reorder" && c.orders >= 5) || (segment === "at-risk" && c.orders <= 2))
    : DEMO_CUSTOMERS;

  const title = segment && SEGMENT_LABELS[segment]
    ? t(SEGMENT_LABELS[segment].ar, SEGMENT_LABELS[segment].en)
    : t("إدارة العملاء", "Manage Customers");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        <p className="text-xs text-muted-foreground">{t("بيانات مجهولة للعرض — Demo", "Anonymized demo data")}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {customers.map((c, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-muted-foreground">{c.city} • {c.orders} {t("طلبات", "orders")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";

type CustomerRow = {
  id: string;
  name: string;
  city: string;
  email: string;
  orders: number;
};

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
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((json) => setCustomers(json.customers ?? []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    if (!segment) return true;
    if (segment === "reorder") return c.orders >= 2;
    if (segment === "at-risk") return c.orders === 0;
    if (segment === "returning") return c.orders > 1;
    if (segment === "high") return c.orders >= 5;
    if (segment === "new") return c.orders <= 1;
    if (segment === "inactive") return c.orders === 0;
    if (segment === "active") return c.orders > 0;
    return true;
  });

  const title = segment && SEGMENT_LABELS[segment]
    ? t(SEGMENT_LABELS[segment].ar, SEGMENT_LABELS[segment].en)
    : t("إدارة العملاء", "Manage Customers");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        <p className="text-xs text-muted-foreground">
          {t("بيانات حقيقية من قاعدة البيانات", "Live data from the database")}
        </p>
      </div>
      {loading ? (
        <p className="text-muted-foreground text-sm">{t("جاري التحميل...", "Loading...")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("لا يوجد عملاء مسجلون بعد.", "No registered customers yet.")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.city} • {c.orders} {t("طلبات", "orders")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

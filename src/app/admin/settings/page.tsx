"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/context/locale-context";
import { SystemSetupPanel } from "@/components/admin/SystemSetupPanel";
import type { City } from "@/types";

export default function AdminSettingsPage() {
  const { t } = useLocale();
  const [cities, setCities] = useState<City[]>([]);
  const [authProvider, setAuthProvider] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/marketplace")
      .then((r) => r.json())
      .then((json) => setCities(json.cities ?? []))
      .catch(() => setCities([]));
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((json) => setAuthProvider(json.provider ?? null))
      .catch(() => setAuthProvider(null));
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("الإعدادات", "Settings")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("حالة الميزات والبنية التحتية", "Feature status and infrastructure")}
        </p>
      </div>

      <SystemSetupPanel />

      <section className="rounded-2xl border border-border/60 bg-white p-5">
        <h3 className="font-semibold text-navy text-sm mb-3">{t("البنية التحتية", "Infrastructure")}</h3>
        <div className="text-sm">
          {authProvider === "postgres" && (
            <p className="text-emerald-700 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t("PostgreSQL على Railway", "Railway PostgreSQL")}
            </p>
          )}
          {authProvider === "supabase" && (
            <p className="text-emerald-700">{t("المصادقة عبر Supabase", "Authentication via Supabase")}</p>
          )}
          {authProvider === "none" && (
            <p className="text-amber-700">{t("المصادقة غير مُعدّة", "Authentication not configured")}</p>
          )}
          {!authProvider && <p className="text-muted-foreground text-xs">{t("جاري التحقق...", "Checking...")}</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-white p-5">
        <h3 className="font-semibold text-navy text-sm mb-3">{t("المدن المفعّلة", "Active cities")}</h3>
        {cities.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("لا توجد مدن بعد", "No cities yet")}</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {cities.map((city) => (
              <div
                key={city.id}
                className="flex justify-between items-center px-3 py-2.5 rounded-xl border border-border/50 bg-slate-50/50"
              >
                <span className="text-sm font-medium text-navy">{city.name_ar}</span>
                <span className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {city.tailor_count} {t("خياط", "tailors")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

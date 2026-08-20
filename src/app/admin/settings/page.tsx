"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("الإعدادات", "Settings")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("إعدادات المنصة والميزات والمدن", "Platform features, env setup, and cities")}
        </p>
      </div>

      <SystemSetupPanel />

      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-navy mb-4">{t("البنية التحتية", "Infrastructure")}</h3>
          <div className="space-y-2 text-sm">
            {authProvider === "postgres" && (
              <p className="text-primary font-medium">
                {t("متصل بقاعدة PostgreSQL على Railway", "Connected to Railway PostgreSQL")}
              </p>
            )}
            {authProvider === "supabase" && (
              <p className="text-primary font-medium">{t("المصادقة عبر Supabase", "Authentication via Supabase")}</p>
            )}
            {authProvider === "none" && (
              <p className="text-amber-700">{t("المصادقة غير مُعدّة", "Authentication not configured")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-navy mb-4">{t("المدن المفعّلة", "Active Cities")}</h3>
          {cities.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("لا توجد مدن بعد", "No cities yet")}</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {cities.map((city) => (
                <div key={city.id} className="flex justify-between items-center p-3 rounded-xl border">
                  <span className="font-medium">{city.name_ar}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {city.tailor_count} {t("خياط", "tailors")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

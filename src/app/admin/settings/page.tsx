"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import type { City } from "@/types";

export default function AdminSettingsPage() {
  const { t } = useLocale();
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    fetch("/api/public/marketplace")
      .then((r) => r.json())
      .then((json) => setCities(json.cities ?? []))
      .catch(() => setCities([]));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("الإعدادات", "Settings")}</h1>
        <p className="text-sm text-muted-foreground">{t("إعدادات المنصة والمدن", "Platform and city settings")}</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-navy mb-4">{t("المدن المفعّلة", "Active Cities")}</h3>
          {cities.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("أضف مدنًا في Supabase", "Add cities in Supabase")}</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {cities.map((city) => (
                <div key={city.id} className="flex justify-between items-center p-3 rounded-xl border">
                  <span className="font-medium">{city.name_ar}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{city.tailor_count} {t("خياط", "tailors")}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

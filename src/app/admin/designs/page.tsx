"use client";

import { useAppState } from "@/lib/context/app-context";
import { useLocale } from "@/lib/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDesignsPage() {
  const { t } = useLocale();
  const { savedDesigns } = useAppState();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("التصاميم", "Designs")}</h1>
        <p className="text-sm text-muted-foreground">{t("تصاميم المنصة المحفوظة", "Saved platform designs")}</p>
      </div>
      {savedDesigns.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">{t("لا توجد تصاميم محفوظة بعد", "No saved designs yet")}</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedDesigns.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-5">
                <p className="font-bold text-navy">{d.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{d.design.garmentType} · {d.design.color}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(d.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

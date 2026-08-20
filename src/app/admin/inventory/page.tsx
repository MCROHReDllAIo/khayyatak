"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import type { InventoryItem } from "@/types";
import { InventoryIntelligenceSection } from "@/components/admin/sections/SupportSections";

export default function AdminInventoryPage() {
  const { t } = useLocale();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [intel, setIntel] = useState<Parameters<typeof InventoryIntelligenceSection>[0]["data"] | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((json) => setIntel(json.inventory))
      .catch(() => setIntel(null));
    fetch("/api/admin/inventory")
      .then((r) => r.json())
      .then((json) => setInventory(json.items ?? []))
      .catch(() => setInventory([]));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("المخزون", "Inventory")}</h1>
        <p className="text-sm text-muted-foreground">{t("مراقبة مخزون الأقمشة على مستوى المنصة", "Platform-wide fabric inventory")}</p>
      </div>
      {intel && <InventoryIntelligenceSection data={intel} />}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-navy mb-4">{t("جميع المواد", "All Materials")}</h3>
          {inventory.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("لا يوجد مخزون مسجل", "No inventory recorded")}</p>
          ) : (
            <div className="space-y-2">
              {inventory.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 text-sm">
                  <span>{item.fabric_name_ar}</span>
                  <span className={item.low_stock ? "text-amber-600 font-medium" : "text-primary"}>
                    {item.current_stock} {item.unit} {item.low_stock && `· ${t("منخفض", "Low")}`}
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

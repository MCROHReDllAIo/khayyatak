"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";
import type { InventoryItem } from "@/types";

export default function AdminProductsPage() {
  const { t } = useLocale();
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    fetch("/api/admin/inventory")
      .then((r) => r.json())
      .then((json) => setItems(json.items ?? []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("الأقمشة والمنتجات", "Fabrics & Products")}</h1>
        <p className="text-sm text-muted-foreground">{t("كتalog المنصة من قاعدة البيانات", "Platform catalog from database")}</p>
      </div>
      {items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">{t("لا توجد منتجات مسجلة", "No products registered")}</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <p className="font-bold text-navy">{item.fabric_name_ar}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.fabric_name_en}</p>
                <p className="text-lg font-semibold text-primary mt-3">{item.current_stock} {item.unit}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

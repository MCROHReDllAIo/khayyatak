"use client";

import { useState } from "react";
import { AlertTriangle, Plus, Minus, Trash2 } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIInsightCard } from "@/components/ai/AIInsightCard";

export default function InventoryPage() {
  const { t } = useLocale();
  const { inventory, updateInventoryItem, addInventoryItem, deleteInventoryItem } = useAppState();
  const [newName, setNewName] = useState("");

  const addItem = () => {
    if (!newName.trim()) return;
    addInventoryItem({
      tailor_id: "t1",
      fabric_name_ar: newName,
      fabric_name_en: newName,
      current_stock: 20,
      unit: "متر",
      consumption_rate: 1,
      ai_forecast_days: 20,
      ai_recommendation_ar: "مخزون جديد — Demo",
      ai_recommendation_en: "New stock — Demo",
      low_stock: false,
    });
    setNewName("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="editorial-title">{t("المخزون الذكي", "Smart Inventory")}</h1>
        <p className="text-sm text-muted-foreground">{t("Demo AI — إدارة مخزون القماش", "Demo AI fabric inventory")}</p>
      </div>

      <div className="flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("اسم الخامة", "Fabric name")} />
        <Button onClick={addItem} className="gap-1"><Plus className="h-4 w-4" />{t("إضافة", "Add")}</Button>
      </div>

      <div className="space-y-4">
        {inventory.length === 0 ? (
          <p className="text-muted-foreground">{t("أضف أول خامة إلى مخزونك.", "Add your first fabric to inventory.")}</p>
        ) : (
          inventory.map((item) => (
            <div key={item.id} className={`rounded-2xl border p-5 ${item.low_stock ? "border-amber-300 bg-amber-50/30" : "border-border/50"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-navy">{item.fabric_name_ar}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("المخزون", "Stock")}: {item.current_stock} {item.unit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("توقع AI", "AI Forecast")}: {item.ai_forecast_days} {t("أيام", "days")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.low_stock && (
                    <span className="flex items-center gap-1 text-amber-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />{t("منخفض", "Low")}
                    </span>
                  )}
                  <Button size="icon" variant="outline" onClick={() => updateInventoryItem(item.id, { current_stock: item.current_stock + 5 })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => updateInventoryItem(item.id, { current_stock: Math.max(0, item.current_stock - 5) })}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteInventoryItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="mt-3">
                <AIInsightCard message={item.ai_recommendation_ar} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

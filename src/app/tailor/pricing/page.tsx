"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { recommendPrice } from "@/lib/ai/pricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatOMR } from "@/lib/utils";

export default function PricingPage() {
  const { t } = useLocale();
  const [input, setInput] = useState({
    fabric_cost: 5,
    labor_hours: 3,
    labor_rate: 2,
    embroidery_cost: 3,
    accessories_cost: 1,
    desired_profit_percent: 30,
  });
  const [result, setResult] = useState<ReturnType<typeof recommendPrice> | null>(null);

  const handleCalculate = () => {
    setResult(recommendPrice(input));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("التسعير الذكي", "Smart Pricing")}</h1>
        <p className="text-muted-foreground">{t("AI يساعدك في تحديد السعر المناسب", "AI helps you set the right price")}</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: "fabric_cost", label: t("تكلفة القماش", "Fabric Cost") },
              { key: "labor_hours", label: t("ساعات العمل", "Labor Hours") },
              { key: "labor_rate", label: t("أجر الساعة", "Hourly Rate") },
              { key: "embroidery_cost", label: t("التطريز", "Embroidery") },
              { key: "accessories_cost", label: t("الإكسسوارات", "Accessories") },
              { key: "desired_profit_percent", label: t("نسبة الربح %", "Profit %") },
            ].map((field) => (
              <div key={field.key}>
                <Label>{field.label}</Label>
                <Input
                  type="number"
                  value={input[field.key as keyof typeof input]}
                  onChange={(e) =>
                    setInput({ ...input, [field.key]: Number(e.target.value) })
                  }
                  className="mt-1"
                />
              </div>
            ))}
          </div>
          <Button onClick={handleCalculate} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            {t("احسب السعر المقترح", "Calculate Recommended Price")}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">{t("السعر المقترح", "Recommended Price")}</p>
              <p className="text-4xl font-bold text-primary">{formatOMR(result.recommended_price)}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-omani-cream p-3">
                <p className="text-xs text-muted-foreground">{t("هامش الربح", "Margin")}</p>
                <p className="font-bold">{result.estimated_margin}%</p>
              </div>
              <div className="rounded-lg bg-omani-cream p-3">
                <p className="text-xs text-muted-foreground">{t("الحد الأدنى", "Min")}</p>
                <p className="font-bold">{formatOMR(result.market_min)}</p>
              </div>
              <div className="rounded-lg bg-omani-cream p-3">
                <p className="text-xs text-muted-foreground">{t("الحد الأعلى", "Max")}</p>
                <p className="font-bold">{formatOMR(result.market_max)}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">{result.reason_ar}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

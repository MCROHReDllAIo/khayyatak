"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/context/locale-context";

export default function TryOnPage() {
  const { t } = useLocale();

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8 text-center">
      <Sparkles className="h-10 w-10 text-primary mx-auto" />
      <h1 className="editorial-title">{t("نظرة افتراضية", "Virtual Look")}</h1>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {t(
          "النظرة الافتراضية متاحة الآن داخل مساعد التسوق الذكي. اختر منتجًا حقيقيًا ثم اضغط «نظرة افتراضية» — النتيجة تأتي من مزود AI حقيقي (Replicate) وليست محاكاة CSS.",
          "Virtual Look is now in the AI Personal Shopper. Pick a real product and tap Virtual Look — results come from a real AI provider (Replicate), not CSS overlay."
        )}
      </p>
      <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
        {t(
          "هذه معاينة بصرية تقريبية وليست ضمانًا للمقاس أو الشكل النهائي.",
          "This is an approximate visual preview, not a fit guarantee."
        )}
      </p>
      <Link href="/customer/ai">
        <Button>{t("افتح مساعد التسوق", "Open AI Shopper")}</Button>
      </Link>
    </div>
  );
}

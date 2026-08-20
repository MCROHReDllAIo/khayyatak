"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, CreditCard, Info } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState, useAuth } from "@/lib/context/app-context";
import { GarmentPreview } from "@/components/designer/GarmentPreview";
import { formatOMR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tailor } from "@/types";

const STEPS = [
  { ar: "التصميم", en: "Design" },
  { ar: "المقاسات", en: "Measurements" },
  { ar: "الخياط", en: "Tailor" },
  { ar: "التسليم", en: "Delivery" },
  { ar: "الدفع", en: "Payment" },
];

export default function CheckoutPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { design, measurements, selectedTailorId, setSelectedTailorId, addOrder } = useAppState();

  const [step, setStep] = useState(selectedTailorId ? 3 : 0);
  const [address, setAddress] = useState("");
  const [processing, setProcessing] = useState(false);
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [tailorOptions, setTailorOptions] = useState<Tailor[]>([]);
  const [loadingTailor, setLoadingTailor] = useState(true);

  const usingSavedMeasurements = searchParams.get("saved") === "1" && Boolean(measurements);

  useEffect(() => {
    fetch("/api/public/marketplace")
      .then((r) => r.json())
      .then((json) => {
        const list = (json.tailors as Tailor[]) ?? [];
        setTailorOptions(list);
        if (selectedTailorId) {
          setTailor(list.find((t_) => t_.id === selectedTailorId) ?? null);
        } else if (list[0]) {
          setTailor(list[0]);
          setSelectedTailorId(list[0].id);
        }
      })
      .finally(() => setLoadingTailor(false));
  }, [selectedTailorId, setSelectedTailorId]);

  useEffect(() => {
    if (selectedTailorId && tailorOptions.length) {
      setTailor(tailorOptions.find((t_) => t_.id === selectedTailorId) ?? null);
    }
  }, [selectedTailorId, tailorOptions]);

  if (loadingTailor) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">
        {t("جاري التحميل...", "Loading...")}
      </div>
    );
  }

  if (!tailor) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <p className="text-muted-foreground">{t("لم يتم اختيار خياط", "No tailor selected")}</p>
        <Button onClick={() => router.push("/customer")}>{t("العودة للرئيسية", "Back to home")}</Button>
      </div>
    );
  }

  const totalPrice = tailor.starting_price + 6.5;

  const handleConfirm = async () => {
    if (!user) return;
    setProcessing(true);
    const order = await addOrder({
      customer_id: user.id,
      tailor_id: tailor.id,
      design,
      measurements: measurements ?? undefined,
      status: "received",
      total_price: totalPrice,
      delivery_days: tailor.delivery_days,
      delivery_address: address || undefined,
    });
    setProcessing(false);
    if (order) router.push(`/customer/orders/${order.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-navy">{t("تأكيد الطلب", "Checkout")}</h1>

      {usingSavedMeasurements && (
        <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          {t("سنستخدم مقاساتك المحفوظة.", "We'll use your saved measurements.")}
        </div>
      )}

      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= step ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="text-[10px] mt-1 text-center">{locale === "ar" ? s.ar : s.en}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {step === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4">
              <GarmentPreview design={design} size="sm" />
              <div>
                <p className="font-bold">
                  {design.color} • {design.fabric}
                </p>
                <p className="text-sm text-muted-foreground">
                  {design.collar} • {design.embroidery}
                </p>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {measurements ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { l: t("الطول", "Height"), v: measurements.height },
                    { l: t("الصدر", "Chest"), v: measurements.chest },
                    { l: t("الخصر", "Waist"), v: measurements.waist },
                  ].map((m) => (
                    <div key={m.l} className="rounded-lg bg-omani-cream p-3">
                      <p className="text-xs text-muted-foreground">{m.l}</p>
                      <p className="font-bold">{m.v} cm</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {t("لم تُحفظ مقاسات — سيتم تأكيدها مع الخياط", "No measurements saved")}
                </p>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {tailorOptions.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("لا يوجد خياطون متاحون", "No tailors available")}</p>
              ) : (
                tailorOptions.map((t_) => (
                  <button
                    key={t_.id}
                    type="button"
                    onClick={() => setSelectedTailorId(t_.id)}
                    className={`w-full text-start p-3 rounded-lg border transition-all ${
                      selectedTailorId === t_.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <p className="font-medium">{locale === "ar" ? t_.name_ar : t_.name_en}</p>
                    <p className="text-sm text-muted-foreground">
                      {t_.city} • ★ {t_.rating}
                    </p>
                  </button>
                ))
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Label>{t("عنوان التسليم", "Delivery Address")}</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {t(`التسليم خلال ${tailor.delivery_days} أيام`, `Delivery in ${tailor.delivery_days} days`)}
              </p>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="rounded-xl bg-omani-cream p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("القطعة", "Garment")}</span>
                  <span>
                    {design.garmentType === "abaya" ? t("عباية", "Abaya") : t("دشداشة", "Dishdasha")} • {design.color}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("القماش", "Fabric")}</span>
                  <span>{design.fabric}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("التطريز", "Embroidery")}</span>
                  <span>{design.embroidery}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("الخياط", "Tailor")}</span>
                  <span>{locale === "ar" ? tailor.name_ar : tailor.name_en}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{t("السعر", "Total")}</span>
                  <span className="text-primary">{formatOMR(totalPrice, locale === "ar" ? "ar" : "en")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <CreditCard className="h-4 w-4" />
                {t("الدفع عند التأكيد مع الخياط", "Payment confirmed with tailor")}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            {t("السابق", "Back")}
          </Button>
        )}
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} className="flex-1">
            {t("التالي", "Next")}
          </Button>
        ) : (
          <Button onClick={handleConfirm} disabled={processing} className="flex-1">
            {processing ? t("جاري التأكيد...", "Confirming...") : t("تأكيد الطلب", "Confirm Order")}
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Users, Cpu, Clock, Heart, RotateCcw } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { BRAND } from "@/lib/constants/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const IMPACTS = [
  { icon: Building2, ar: "دعم المنشآت المحلية", en: "Support Local Businesses", desc_ar: "تمكين الخياطين العمانيين من الوصول لعملاء جدد", desc_en: "Empowering Omani tailors to reach new customers" },
  { icon: Users, ar: "زيادة الوصول للعملاء", en: "Increase Customer Reach", desc_ar: "ربط العملاء بشبكة وطنية من الخياطين", desc_en: "Connecting customers to a national tailor network" },
  { icon: Cpu, ar: "رقمنة العمليات", en: "Digitize Operations", desc_ar: "تحويل العمليات اليدوية إلى تجربة رقمية", desc_en: "Transforming manual processes into digital experience" },
  { icon: Clock, ar: "تقليل الوقت الإداري", en: "Reduce Admin Time", desc_ar: "أتمتة المتابعة والتسعير والمخزون", desc_en: "Automating tracking, pricing, and inventory" },
  { icon: Heart, ar: "تحسين تجربة العميل", en: "Better Customer Experience", desc_ar: "رحلة سلسة من التصميم إلى التسليم", desc_en: "Smooth journey from design to delivery" },
  { icon: RotateCcw, ar: "تشجيع إعادة الشراء", en: "Encourage Repeat Purchases", desc_ar: "قياسات محفوظة وإعادة طلب بضغطة واحدة", desc_en: "Saved measurements and one-click reorder" },
];

export default function ImpactPage() {
  const { t, locale } = useLocale();

  return (
    <div className="min-h-screen bg-omani-cream">
      <header className="sticky top-[29px] z-40 glass border-b px-4 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("الرئيسية", "Home")}
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl font-bold text-navy">{t(`أثر ${BRAND.nameAr}`, `${BRAND.nameEn} Impact`)}</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            {t(
              "تحويل رقمي للأعمال المحلية — Potential Impact",
              "Digital transformation of local businesses — Potential Impact"
            )}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {IMPACTS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full hover:shadow-premium transition-shadow">
                <CardContent className="p-6">
                  <item.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-bold text-navy">{locale === "ar" ? item.ar : item.en}</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {locale === "ar" ? item.desc_ar : item.desc_en}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-xs text-muted-foreground mb-4">{t("Demo Metrics — مقاييس تجريبية", "Demo Metrics — Prototype indicators")}</p>
          <Link href="/login"><Button size="lg">{t("استكشف المنصة", "Explore Platform")}</Button></Link>
        </div>
      </div>
    </div>
  );
}

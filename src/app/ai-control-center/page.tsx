"use client";

import Link from "next/link";
import { BRAND } from "@/lib/constants/brand";
import { motion } from "framer-motion";
import {
  Sparkles,
  Palette,
  Ruler,
  Users,
  ShoppingBag,
  Package,
  DollarSign,
  TrendingUp,
  Megaphone,
  Shield,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/context/locale-context";

const NODES = [
  { id: "customer", label: "Customer AI", label_ar: "ذكاء العميل", icon: Sparkles, angle: 0 },
  { id: "design", label: "Design AI", label_ar: "ذكاء التصميم", icon: Palette, angle: 32 },
  { id: "measure", label: "Measurement AI", label_ar: "ذكاء القياس", icon: Ruler, angle: 64 },
  { id: "match", label: "Matching AI", label_ar: "ذكاء المطابقة", icon: Users, angle: 96 },
  { id: "order", label: "Order AI", label_ar: "ذكاء الطلبات", icon: ShoppingBag, angle: 128 },
  { id: "tailor", label: "Tailor AI", label_ar: "ذكاء الخياط", icon: Sparkles, angle: 160 },
  { id: "inventory", label: "Inventory AI", label_ar: "ذكاء المخزون", icon: Package, angle: 192 },
  { id: "pricing", label: "Pricing AI", label_ar: "ذكاء التسعير", icon: DollarSign, angle: 224 },
  { id: "forecast", label: "Forecast AI", label_ar: "توقع الطلب", icon: TrendingUp, angle: 256 },
  { id: "marketing", label: "Marketing AI", label_ar: "ذكاء التسويق", icon: Megaphone, angle: 288 },
  { id: "quality", label: "Quality AI", label_ar: "ذكاء الجودة", icon: Shield, angle: 320 },
  { id: "national", label: "National Intel", label_ar: "الذكاء الوطني", icon: Globe, angle: 352 },
];

export default function AIControlCenterPage() {
  const { t, locale } = useLocale();
  const radius = 180;

  return (
    <div className="min-h-screen bg-navy text-white overflow-hidden">
      <header className="sticky top-[29px] z-40 border-b border-white/10 px-4 py-4 flex justify-between items-center">
        <Link href="/" className="font-bold font-arabic text-navy">{BRAND.nameAr}</Link>
        <Link href="/presentation"><Button variant="gold" size="sm">{t("العرض", "Presentation")}</Button></Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-2">AI Control Center</h1>
        <p className="text-white/60 mb-12">{t("مركز التحكم — طبقة الذكاء الاصطناعي للخياطة", "The AI intelligence layer for tailoring")}</p>

        <div className="relative mx-auto w-[440px] h-[440px] max-w-full">
          <motion.div
            animate={{ boxShadow: ["0 0 40px rgba(22,130,91,0.3)", "0 0 60px rgba(198,161,91,0.4)", "0 0 40px rgba(22,130,91,0.3)"] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute inset-0 m-auto w-32 h-32 rounded-full bg-gradient-to-br from-primary to-omani-gold flex items-center justify-center z-10"
          >
            <div className="text-center">
              <Sparkles className="h-8 w-8 mx-auto" />
              <p className="text-xs font-bold mt-1">Smart<br />Tailor AI</p>
            </div>
          </motion.div>

          {NODES.map((node, i) => {
            const rad = (node.angle * Math.PI) / 180;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
              >
                <div className="w-20 h-20 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm flex flex-col items-center justify-center p-2 hover:bg-white/20 transition-colors">
                  <node.icon className="h-5 w-5 text-omani-gold mb-1" />
                  <span className="text-[9px] leading-tight text-center">
                    {locale === "ar" ? node.label_ar : node.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-16 text-white/50 text-sm max-w-xl mx-auto">
          {t(
            "منصة واحدة تربط العميل والخياط والذكاء الاصطناعي — من الفكرة إلى التنفيذ إلى نمو الأعمال.",
            "One platform connecting customer, tailor, and AI — from idea to execution to business growth."
          )}
        </p>
        <Link href="/login" className="inline-block mt-8">
          <Button size="lg" variant="gold">{t("جرّب المنصة", "Try Platform")}</Button>
        </Link>
      </div>
    </div>
  );
}

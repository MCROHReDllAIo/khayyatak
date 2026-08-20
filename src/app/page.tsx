"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Ruler,
  Palette,
  Users,
  TrendingUp,
  ArrowLeft,
  Star,
  MapPin,
  MessageSquare,
  Phone,
  FileText,
  Clock,
  Search,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { BRAND } from "@/lib/constants/brand";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GarmentPreview } from "@/components/designer/GarmentPreview";
import { ConciergeInput } from "@/components/ai/ConciergeInput";
import { AIStatusBanner } from "@/components/ai/AIStatusBadge";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { TailorCard } from "@/components/tailor/TailorCard";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { useMarketplaceData } from "@/hooks/useMarketplace";
import { matchTailors } from "@/lib/ai/matching";
import { DESIGN_COLORS, GARMENT_TYPES, type GarmentType } from "@/types";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const AI_LABELS = [
  { ar: "AI Design", en: "AI Design" },
  { ar: "AI Measurement", en: "AI Measurement" },
  { ar: "AI Match", en: "AI Match" },
  { ar: "Style DNA", en: "Style DNA" },
];

export default function HomePage() {
  const { t, locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const [previewDesign, setPreviewDesign] = useState<{
    garmentType: GarmentType;
    color: string;
    colorKey: string;
    fabric: string;
    fabricKey: string;
    collar: string;
    collarKey: string;
    embroidery: string;
    embroideryKey: string;
  }>({
    garmentType: "dishdasha",
    color: "أبيض",
    colorKey: "white",
    fabric: "كتان",
    fabricKey: "linen",
    collar: "عمانية",
    collarKey: "omani",
    embroidery: "ذهبي",
    embroideryKey: "gold",
  });
  const { tailors, cities } = useMarketplaceData();

  const [colorIdx, setColorIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIdx((i) => {
        const next = (i + 1) % DESIGN_COLORS.length;
        setPreviewDesign((d) => ({
          ...d,
          color: DESIGN_COLORS[next].ar,
          colorKey: DESIGN_COLORS[next].key,
        }));
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const featuredTailors = matchTailors(tailors, { budget: 20 }).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-[29px] inset-x-0 z-40 glass border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#how" className="text-muted-foreground hover:text-foreground">{t("كيف يعمل", "How it works")}</a>
            <a href="#ai" className="text-muted-foreground hover:text-foreground">{t("الذكاء الاصطناعي", "AI")}</a>
            <a href="#tailors" className="text-muted-foreground hover:text-foreground">{t("الخياطون", "Tailors")}</a>
            <Link href="/marketplace" className="text-muted-foreground hover:text-foreground">{t("السوق", "Marketplace")}</Link>
            <Link href="/ai-control-center" className="text-muted-foreground hover:text-foreground">{t("AI Center", "AI Center")}</Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground">{t("الخصوصية", "Privacy")}</Link>
            <Link href="/presentation" className="text-muted-foreground hover:text-foreground">{t("العرض", "Presentation")}</Link>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Link href="/customer">
                <Button size="sm">{t("لوحة التحكم", "Dashboard")}</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="outline">{t("دخول", "Login")}</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero — AI-first */}
      <section className="gradient-hero pt-28 pb-16 md:pb-24 px-4 relative overflow-hidden">
        <GeometricPattern className="text-white opacity-20" />
        <div className="max-w-4xl mx-auto relative text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-omani-gold text-xs font-semibold uppercase tracking-[0.3em] mb-4">
              {t(BRAND.nameAr, BRAND.nameEn)}
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              {t(BRAND.taglineAr, BRAND.taglineEn)}
            </h1>
            <p className="text-white/60 mt-6 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              {t(BRAND.descriptionAr, BRAND.descriptionEn)}
            </p>
          </motion.div>

          <div className="mt-10 md:mt-14 max-w-2xl mx-auto">
            <AIStatusBanner />
            <ConciergeInput variant="hero" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex justify-center"
          >
            <div className="relative p-6 md:p-8">
              <GarmentPreview design={previewDesign} size="lg" />
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {GARMENT_TYPES.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() =>
                      setPreviewDesign((d) => ({
                        ...d,
                        garmentType: g.key,
                        color: g.key === "abaya" ? "أسود" : d.color,
                        colorKey: g.key === "abaya" ? "black" : d.colorKey,
                      }))
                    }
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                      previewDesign.garmentType === g.key
                        ? "bg-white text-navy border-white"
                        : "border-white/30 text-white/80 hover:border-white/60"
                    )}
                  >
                    {locale === "ar" ? g.ar : g.en}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {AI_LABELS.map((label, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-white/50"
              >
                <Sparkles className="h-3 w-3 text-omani-gold" />
                {locale === "ar" ? label.ar : label.en}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-4 bg-omani-cream">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">
            {t("الخياطة التقليدية ما زالت تعتمد على:", "Traditional tailoring still relies on:")}
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {[
              { icon: MessageSquare, ar: "WhatsApp", en: "WhatsApp" },
              { icon: Phone, ar: "اتصالات", en: "Phone calls" },
              { icon: FileText, ar: "قياسات ورقية", en: "Paper measurements" },
              { icon: Clock, ar: "متابعة يدوية", en: "Manual tracking" },
              { icon: Search, ar: "مقارنة أسعار صعبة", en: "Hard price comparison" },
              { icon: Users, ar: "صعوبة الوصول للعملاء", en: "Hard to reach customers" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="text-center h-full">
                  <CardContent className="p-4">
                    <item.icon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">{locale === "ar" ? item.ar : item.en}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xl font-semibold text-primary">
            {t(`${BRAND.nameAr} يحول هذه العملية إلى تجربة رقمية.`, `${BRAND.nameEn} transforms this into a digital experience.`)}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">{t("كيف يعمل", "How It Works")}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", ar: "صمّم", en: "Design", icon: Palette, href: "/customer/designer" },
              { step: "2", ar: "قِس", en: "Measure", icon: Ruler, href: "/customer/measurements" },
              { step: "3", ar: "اختر", en: "Choose", icon: Users, href: "/customer/tailors" },
              { step: "4", ar: "استلم", en: "Receive", icon: Sparkles, href: "/customer/orders" },
            ].map((item, i) => (
              <Link key={i} href={item.href}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="text-center p-6 rounded-2xl border hover:shadow-premium transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="text-omani-gold font-bold text-sm">{item.step}</span>
                  <h3 className="text-xl font-bold text-navy mt-1">{locale === "ar" ? item.ar : item.en}</h3>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section id="ai" className="py-20 px-4 bg-navy text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">{t("ميزات الذكاء الاصطناعي", "AI Features")}</h2>
          <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
            {t("من أول قياس إلى آخر غرزة... كل شيء أذكى.", "From first measurement to last stitch... everything is smarter.")}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { ar: "AI Measurement", en: "AI Measurement", desc_ar: "قياسات تقديرية بالكاميرا", desc_en: "Camera-based estimate measurements" },
              { ar: "AI Style Assistant", en: "AI Style Assistant", desc_ar: "تصميم من وصف طبيعي", desc_en: "Design from natural language" },
              { ar: "مطابقة ذكية", en: "AI Match", desc_ar: "مطابقة ذكية مع الخياط", desc_en: "Smart tailor matching" },
              { ar: "Smart Pricing", en: "Smart Pricing", desc_ar: "تسعير ذكي للخياطين", desc_en: "Smart pricing for tailors" },
              { ar: "Demand Forecasting", en: "Demand Forecasting", desc_ar: "توقع الطلب والاتجاهات", desc_en: "Demand and trend forecasting" },
              { ar: "Customer Insights", en: "Customer Insights", desc_ar: "تحليل تفضيلات العملاء", desc_en: "Customer preference analysis" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors"
              >
                <Sparkles className="h-5 w-5 text-omani-gold mb-3" />
                <h3 className="font-bold">{locale === "ar" ? f.ar : f.en}</h3>
                <p className="text-white/60 text-sm mt-1">{locale === "ar" ? f.desc_ar : f.desc_en}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tailor Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-navy mb-4">
            {t("نحن لا ننافس الخياطين... نحن نمكّنهم.", "We don't compete with tailors... we empower them.")}
          </h2>
          <div className="grid md:grid-cols-4 gap-6 mt-12">
            {[
              { ar: "العملاء", en: "Customers", val: "+40%", desc_ar: "وصول لعملاء جدد", desc_en: "Reach new customers" },
              { ar: "المبيعات", en: "Sales", val: "+28%", desc_ar: "زيادة في الطلبات", desc_en: "Increase in orders" },
              { ar: "الكفاءة", en: "Efficiency", val: "-35%", desc_ar: "تقليل الوقت الإداري", desc_en: "Less admin time" },
              { ar: "معرفة الطلب", en: "Demand Knowledge", val: "AI", desc_ar: "توقعات ذكية", desc_en: "Smart forecasts" },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-primary">{item.val}</p>
                  <h3 className="font-bold text-navy mt-2">{locale === "ar" ? item.ar : item.en}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{locale === "ar" ? item.desc_ar : item.desc_en}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">{t("من قاعدة البيانات", "From database")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Oman Map */}
      <section className="py-20 px-4 bg-omani-cream">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">{t("تغطية عُمان", "Oman Coverage")}</h2>
          <div className="grid md:grid-cols-5 gap-4">
            {cities.map((city) => (
              <Card key={city.id} className="text-center hover:shadow-premium transition-shadow">
                <CardContent className="p-5">
                  <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
                  <h3 className="font-bold text-navy">{locale === "ar" ? city.name_ar : city.name_en}</h3>
                  <p className="text-2xl font-bold text-primary mt-2">{city.tailor_count}</p>
                  <p className="text-xs text-muted-foreground">{t("خياط", "tailors")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tailors */}
      <section id="tailors" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">{t("خياطون مميزون", "Featured Tailors")}</h2>
          {featuredTailors.length === 0 ? (
            <p className="text-center text-muted-foreground">{t("لا يوجد خياطون مسجلون بعد", "No tailors registered yet")}</p>
          ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {featuredTailors.map((match) => (
              <TailorCard key={match.tailor.id} match={match} />
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-omani-cream">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">{t("آراء العملاء", "Customer Reviews")}</h2>
          <p className="text-center text-muted-foreground py-8">{t("لا توجد تقييمات بعد", "No reviews yet")}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 gradient-hero">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("ابدأ أول تصميم لك اليوم.", "Start your first design today.")}
          </h2>
          <p className="text-white/70 mb-8">
            {t("من أول قياس إلى آخر غرزة... كل شيء أذكى.", "From first measurement to last stitch... everything is smarter.")}
          </p>
          <Link href="/login">
            <Button size="lg" variant="gold">{t("ابدأ الآن", "Get Started")}</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo showTagline />
          <p className="text-sm text-muted-foreground">
            {BRAND.copyright} — {t("منصة وطنية للخياطة الذكية", "National Smart Tailoring Platform")}
          </p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  MessageCircle,
  Phone,
  FileText,
  Ruler,
  Package,
  Users,
  ArrowRight,
  Scissors,
  Brain,
  MapPin,
  Star,
  BadgeCheck,
  ImageIcon,
  Camera,
  Shirt,
  Palette,
  TrendingUp,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { GarmentPreview } from "@/components/designer/GarmentPreview";
import { DEFAULT_DESIGN } from "@/lib/constants/defaults";
import type { SlideDefinition } from "@/lib/presentation/types";
import { DEMO_LINKS, JUDGE_QUESTIONS } from "@/lib/presentation/content";

const fade = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

function SlideShell({
  children,
  dark = false,
  className = "",
}: {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        dark ? "bg-[#071A33] text-white" : "bg-[#F5F0E7] text-[#101828]"
      } ${className}`}
    >
      {dark && <GeometricPattern className="text-white opacity-20" />}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16">{children}</div>
    </div>
  );
}

function GoldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[10px] md:text-xs font-bold uppercase tracking-[0.35em] text-[#C8A45D] mb-4">
      {children}
    </span>
  );
}

export function SlideVisual({ slide }: { slide: SlideDefinition }) {
  switch (slide.type) {
    case "hook":
      return (
        <SlideShell dark className="bg-gradient-to-br from-[#071A33] via-[#0a2240] to-[#071A33]">
          <motion.div {...fade} className="max-w-5xl mx-auto text-center">
            <GoldLabel>OMAN × AI × FASHION</GoldLabel>
            <div className="mx-auto mb-10 h-48 w-48 md:h-64 md:w-64 rounded-full border border-[#C8A45D]/30 bg-gradient-to-br from-[#0F7654]/40 to-[#071A33] flex items-center justify-center shadow-[0_0_80px_-20px_rgba(200,164,93,0.4)]">
              <Shirt className="h-20 w-20 md:h-28 md:w-28 text-[#C8A45D]/80" strokeWidth={1} />
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4 font-arabic">خياطك</h1>
            <p className="text-xl md:text-3xl font-arabic text-white/90 mb-6">نفصّلها على مقاسك... بذكاء</p>
            <p className="text-base md:text-xl text-[#C8A45D] font-medium max-w-2xl mx-auto leading-relaxed">
              من أول قياس إلى آخر غرزة... كل شيء أذكى.
            </p>
          </motion.div>
        </SlideShell>
      );

    case "problem":
      return (
        <SlideShell>
          <motion.div {...fade} className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto w-full">
            <div>
              <GoldLabel>THE PROBLEM</GoldLabel>
              <h2 className="text-4xl md:text-6xl font-bold leading-[1.1] mb-4">المشكلة ليست في الخياط.</h2>
              <p className="text-3xl md:text-5xl font-bold text-[#0F7654]">المشكلة في العملية.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {[
                { icon: MessageCircle, label: "WhatsApp" },
                { icon: Phone, label: "Calls" },
                { icon: FileText, label: "Paper" },
                { icon: Ruler, label: "Manual Measurements" },
                { icon: Package, label: "Scattered Orders" },
                { icon: Users, label: "Limited Reach" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#071A33]/10 bg-white/80 p-5 md:p-6 flex flex-col gap-3 shadow-sm"
                >
                  <Icon className="h-6 w-6 text-[#0F7654]" />
                  <span className="text-sm md:text-base font-medium text-[#101828]/80">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </SlideShell>
      );

    case "big-idea":
      return (
        <SlideShell dark>
          <motion.div {...fade} className="max-w-5xl mx-auto text-center">
            <GoldLabel>THE BIG IDEA</GoldLabel>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-snug mb-16 font-arabic">
              ماذا لو أصبح الخياط التقليدي...
              <br />
              <span className="text-[#C8A45D]">مدعومًا بالذكاء الاصطناعي؟</span>
            </h2>
            <div className="flex items-center justify-center gap-4 md:gap-8 text-lg md:text-2xl font-semibold">
              <div className="rounded-2xl border border-white/15 bg-white/5 px-6 py-8 min-w-[120px]">
                <Scissors className="h-8 w-8 mx-auto mb-2 text-[#C8A45D]" />
                Traditional Tailor
              </div>
              <span className="text-4xl text-[#C8A45D]">×</span>
              <div className="rounded-2xl border border-[#0F7654]/50 bg-[#0F7654]/20 px-6 py-8 min-w-[120px]">
                <Brain className="h-8 w-8 mx-auto mb-2 text-white" />
                AI
              </div>
              <span className="text-4xl text-[#C8A45D]">=</span>
              <div className="rounded-2xl border border-[#C8A45D]/50 bg-[#C8A45D]/10 px-6 py-8 min-w-[120px]">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-[#C8A45D]" />
                خياطك
              </div>
            </div>
            <p className="mt-12 text-xl text-white/60 font-arabic">نحن لا نستبدل الخياط، نحن نمكّنه.</p>
          </motion.div>
        </SlideShell>
      );

    case "journey": {
      const steps = ["IDEA", "AI", "DESIGN", "MEASURE", "MATCH", "ORDER", "TAILOR", "DELIVERY"];
      return (
        <SlideShell>
          <motion.div {...fade} className="max-w-6xl mx-auto w-full">
            <GoldLabel>CUSTOMER JOURNEY</GoldLabel>
            <h2 className="text-3xl md:text-5xl font-bold mb-12">من الفكرة إلى التسليم</h2>
            <div className="relative flex flex-wrap justify-center gap-2 md:gap-0 md:flex-nowrap items-center">
              {steps.map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className="relative rounded-xl bg-[#071A33] text-white px-4 py-3 md:px-5 md:py-4 text-xs md:text-sm font-bold tracking-wide shadow-lg">
                    {step}
                    <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-[#0F7654]/0 via-[#C8A45D]/40 to-[#0F7654]/0 opacity-60 blur-sm -z-10" />
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight className="hidden md:block h-4 w-4 mx-1 text-[#C8A45D] shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-12 text-center text-lg text-[#101828]/60 max-w-2xl mx-auto">
              AI → DESIGN → TAILOR — one continuous intelligent experience
            </p>
          </motion.div>
        </SlideShell>
      );
    }

    case "demo-break":
      return (
        <SlideShell dark className="bg-gradient-to-br from-[#0F7654]/30 to-[#071A33]">
          <motion.div {...fade} className="max-w-4xl mx-auto text-center">
            <GoldLabel>LIVE PROTOTYPE</GoldLabel>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 font-arabic">بدل ما أشرح لكم...</h2>
            <p className="text-2xl md:text-4xl text-[#C8A45D] font-bold mb-12">خلوني أوريكم.</p>
            <div className="grid sm:grid-cols-2 gap-3 text-start max-w-2xl mx-auto">
              {DEMO_LINKS.slice(0, 6).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors group"
                >
                  <span className="text-[#C8A45D] font-bold text-sm">{String(link.step).padStart(2, "0")}</span>
                  <span className="text-sm flex-1 font-arabic">{link.label_ar}</span>
                  <ExternalLink className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
            <p className="mt-8 text-sm text-white/40">اضغط D في أي وقت لفتح لوحة العرض الحي</p>
          </motion.div>
        </SlideShell>
      );

    case "concierge":
      return (
        <SlideShell>
          <motion.div {...fade} className="grid lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto w-full">
            <div>
              <GoldLabel>AI FASHION CONCIERGE</GoldLabel>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">تحدث بشكل طبيعي</h2>
              <div className="flex flex-wrap gap-2">
                {["Arabic Understanding", "Intent", "Style", "Occasion", "Budget"].map((tag) => (
                  <span key={tag} className="rounded-full border border-[#0F7654]/30 bg-[#0F7654]/5 px-3 py-1 text-xs font-medium text-[#0F7654]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#071A33]/10 bg-white shadow-[0_24px_80px_-20px_rgba(7,26,51,0.2)] overflow-hidden">
              <div className="bg-[#071A33] px-4 py-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C8A45D]" />
                <span className="text-sm text-white/80">AI Concierge</span>
              </div>
              <div className="p-5 space-y-4 font-arabic">
                <div className="rounded-xl bg-[#F5F0E7] p-4 text-sm md:text-base leading-relaxed">
                  أبغى دشداشة بيضاء صيفية رسمية وفخمة لكن بسيطة.
                </div>
                <div className="rounded-xl bg-[#0F7654]/10 border border-[#0F7654]/20 p-4 text-sm md:text-base leading-relaxed text-[#0F7654]">
                  ✓ أبيض · ✓ صيفي · ✓ رسمي · ✓ تطريز بسيط · ✓ فاخر
                  <br />
                  <span className="text-[#101828]/60 text-xs mt-2 block">فهمت طلبك — جاهز للتصميم</span>
                </div>
              </div>
            </div>
          </motion.div>
        </SlideShell>
      );

    case "design-studio":
      return (
        <SlideShell dark>
          <motion.div {...fade} className="grid lg:grid-cols-[1fr_1.2fr] gap-10 items-center max-w-6xl mx-auto w-full">
            <div>
              <GoldLabel>AI DESIGN STUDIO</GoldLabel>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">الكلام يغيّر التصميم</h2>
              <div className="rounded-xl border border-white/15 bg-white/5 p-4 font-arabic text-lg mb-6">
                &quot;خلّيه أنحف.&quot;
              </div>
              <div className="flex flex-wrap gap-2">
                {["Color", "Fabric", "Fit", "Collar", "Embroidery"].map((x) => (
                  <span key={x} className="text-xs uppercase tracking-wider text-white/50 border border-white/10 rounded-full px-3 py-1">
                    {x}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center">
              <GarmentPreview design={{ ...DEFAULT_DESIGN, fit: "أنحف", fitKey: "slim", collar: "عصرية" }} size="lg" />
              <p className="mt-4 text-sm text-[#C8A45D]">Fit: Slim · Fabric: Summer · Collar: Modern</p>
            </div>
          </motion.div>
        </SlideShell>
      );

    case "vision-measure":
      return (
        <SlideShell>
          <motion.div {...fade} className="max-w-6xl mx-auto w-full">
            <GoldLabel>VISION + MEASUREMENT</GoldLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-10">صورة · قياس · تجربة</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="rounded-2xl border border-[#071A33]/10 bg-white p-6 min-h-[200px]">
                <ImageIcon className="h-8 w-8 text-[#0F7654] mb-4" />
                <p className="font-bold mb-2">Inspiration Image</p>
                <p className="text-sm text-[#101828]/60">AI يحلل اللون · القماش · القصة · التطريز</p>
                <div className="mt-4 rounded-lg bg-[#F5F0E7] h-24 flex items-center justify-center text-xs text-[#101828]/40">
                  Upload → Analyze
                </div>
              </div>
              <div className="rounded-2xl border border-[#071A33]/10 bg-white p-6 min-h-[200px]">
                <Camera className="h-8 w-8 text-[#0F7654] mb-4" />
                <p className="font-bold mb-2">AI Measurement</p>
                <p className="text-sm text-[#101828]/60">تقدير + Confidence Score · الخياط يراجع</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  {["Height", "Chest", "Waist"].map((m) => (
                    <div key={m} className="rounded-lg bg-[#0F7654]/10 py-3 font-medium">{m}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-[#C8A45D]/40 bg-[#C8A45D]/5 px-6 py-4 text-center text-sm text-[#101828]/70">
              Virtual Try-On — <span className="text-[#0F7654] font-medium">المرحلة القادمة</span> (كن صريحًا في العرض)
            </div>
          </motion.div>
        </SlideShell>
      );

    case "matching":
      return (
        <SlideShell dark>
          <motion.div {...fade} className="max-w-6xl mx-auto w-full">
            <GoldLabel>AI TAILOR MATCHING</GoldLabel>
            <h2 className="text-3xl md:text-4xl font-bold mb-8 font-arabic">أفضل خياط لهذا التصميم</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: "خياط الأصالة", city: "صلالة", score: 87, best: true },
                { name: "دار الخياطة", city: "مسقط", score: 79, best: false },
                { name: "مشغل النخبة", city: "صحار", score: 72, best: false },
              ].map((t) => (
                <div
                  key={t.name}
                  className={`rounded-2xl border p-4 ${
                    t.best ? "border-[#C8A45D]/60 bg-[#C8A45D]/10 shadow-[0_0_30px_-10px_rgba(200,164,93,0.5)]" : "border-white/10 bg-white/5"
                  }`}
                >
                  {t.best && <p className="text-[10px] font-bold text-[#C8A45D] uppercase tracking-wider mb-2">أفضل تطابق</p>}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold font-arabic">{t.name}</p>
                      <p className="text-xs text-white/50 flex items-center gap-1"><MapPin className="h-3 w-3" />{t.city}</p>
                    </div>
                    <BadgeCheck className="h-4 w-4 text-[#0F7654]" />
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-3">
                    <Star className="h-3 w-3 fill-[#C8A45D] text-[#C8A45D]" /> 4.9
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#0F7654]/30 px-2 py-1 text-xs font-bold">
                    <Sparkles className="h-3 w-3 text-[#C8A45D]" /> AI Match {t.score}%
                  </div>
                  <p className="text-[10px] text-white/40 mt-2">محسوب من بيانات حقيقية — مثال توضيحي</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-8 justify-center">
              {["Style", "Price", "Rating", "Location", "Speed"].map((f) => (
                <span key={f} className="text-xs text-white/50 border border-white/10 rounded-full px-3 py-1">{f}</span>
              ))}
            </div>
          </motion.div>
        </SlideShell>
      );

    case "specification":
      return (
        <SlideShell>
          <motion.div {...fade} className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full items-center">
            <div>
              <GoldLabel>DIFFERENTIATOR</GoldLabel>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 font-arabic">من لغة العميل إلى لغة الخياط</h2>
              <p className="text-[#101828]/60">Customer language → Professional specification</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-red-200/60 bg-red-50/50 p-4 text-xs space-y-2 opacity-80">
                <p className="font-bold text-red-900/60 mb-2">Customer chat</p>
                <p className="font-arabic text-[#101828]/70">&quot;أبغى شي رسمي للدوام...&quot;</p>
                <p className="font-arabic text-[#101828]/70">&quot;مو وايد تطريز&quot;</p>
                <p className="font-arabic text-[#101828]/70">&quot;صيفي وخفيف&quot;</p>
              </div>
              <div className="rounded-2xl border border-[#0F7654]/30 bg-white p-4 text-xs space-y-1.5 shadow-lg">
                <p className="font-bold text-[#0F7654] mb-2">Tailoring Spec</p>
                {["Garment: Dishdasha", "Color: White", "Fabric: Summer", "Fit: Slim", "Embroidery: Minimal", "Measurements ✓", "Reference Image ✓", "Budget: 15–20 OMR"].map((line) => (
                  <p key={line} className="text-[#101828]/80">{line}</p>
                ))}
              </div>
            </div>
          </motion.div>
        </SlideShell>
      );

    case "tailor-ai":
      return (
        <SlideShell dark>
          <motion.div {...fade} className="grid lg:grid-cols-2 gap-10 max-w-6xl mx-auto w-full items-center">
            <div>
              <GoldLabel>SMART TAILOR BRAIN</GoldLabel>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">AI للخياط</h2>
              <div className="flex flex-wrap gap-2">
                {["Orders", "Inventory", "Pricing", "Customers", "Forecast"].map((x) => (
                  <span key={x} className="rounded-full border border-white/15 px-3 py-1 text-sm">{x}</span>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {[
                "3 طلبات معرضة للتأخر.",
                "مخزون القماش الأبيض يكفي 6 أيام.",
                "ارتفاع في الطلب على الثياب الرسمية.",
              ].map((insight) => (
                <div key={insight} className="rounded-xl border border-[#C8A45D]/30 bg-[#C8A45D]/10 px-5 py-4 flex items-start gap-3 font-arabic">
                  <Sparkles className="h-5 w-5 text-[#C8A45D] shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </div>
              ))}
              <p className="text-xs text-white/40 pt-2">Insights from real dashboard when data exists</p>
            </div>
          </motion.div>
        </SlideShell>
      );

    case "style-dna":
      return (
        <SlideShell>
          <motion.div {...fade} className="max-w-4xl mx-auto w-full text-center">
            <GoldLabel>STYLE DNA</GoldLabel>
            <h2 className="text-3xl md:text-5xl font-bold mb-12">One-Tap Reorder</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              {[
                { label: "Style DNA", icon: Palette, sub: "أبيض · صيفي · رسمي" },
                { label: "Previous Order", icon: Package, sub: "Design + Measurements" },
                { label: "One Tap", icon: Sparkles, sub: "Reorder instantly" },
              ].map(({ label, icon: Icon, sub }, i) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="rounded-2xl border border-[#071A33]/10 bg-white px-8 py-6 shadow-sm min-w-[160px]">
                    <Icon className="h-8 w-8 text-[#0F7654] mx-auto mb-3" />
                    <p className="font-bold">{label}</p>
                    <p className="text-xs text-[#101828]/50 mt-1 font-arabic">{sub}</p>
                  </div>
                  {i < 2 && <ArrowRight className="hidden md:block h-5 w-5 text-[#C8A45D]" />}
                </div>
              ))}
            </div>
          </motion.div>
        </SlideShell>
      );

    case "ecosystem": {
      const nodes = [
        "Concierge", "Design", "Vision", "Measurement", "Style DNA", "Matching",
        "Orders", "Pricing", "Inventory", "Forecasting", "Marketing", "Quality", "Voice", "Agents",
      ];
      return (
        <SlideShell dark>
          <motion.div {...fade} className="max-w-5xl mx-auto w-full text-center">
            <GoldLabel>THE ECOSYSTEM</GoldLabel>
            <div className="relative my-12">
              <div className="mx-auto w-48 h-48 rounded-full border-2 border-[#C8A45D]/50 bg-[#0F7654]/20 flex items-center justify-center shadow-[0_0_60px_-15px_rgba(200,164,93,0.4)]">
                <div>
                  <p className="text-lg font-bold">SMART</p>
                  <p className="text-2xl font-bold text-[#C8A45D]">TAILOR AI</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-10 max-w-3xl mx-auto">
                {nodes.map((n) => (
                  <span key={n} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </SlideShell>
      );
    }

    case "oman": {
      const cities = ["Muscat", "Salalah", "Sohar", "Nizwa", "Sur"];
      return (
        <SlideShell>
          <motion.div {...fade} className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto w-full items-center">
            <div>
              <GoldLabel>WHY OMAN</GoldLabel>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">National Platform</h2>
              <p className="text-lg text-[#101828]/60 leading-relaxed">
                شبكة خياطين · عملاء · طلبات · اتجاهات — بدون أرقام وهمية. الرؤية قبل الإحصاء.
              </p>
            </div>
            <div className="relative rounded-3xl border border-[#071A33]/10 bg-white p-8 min-h-[280px]">
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <MapPin className="h-32 w-32 text-[#0F7654]" />
              </div>
              <div className="relative grid grid-cols-2 gap-3">
                {cities.map((city) => (
                  <div key={city} className="rounded-xl border border-[#0F7654]/20 bg-[#0F7654]/5 px-4 py-3 text-center">
                    <MapPin className="h-4 w-4 text-[#0F7654] mx-auto mb-1" />
                    <p className="font-medium text-sm">{city}</p>
                  </div>
                ))}
              </div>
              <p className="relative text-center text-xs text-[#101828]/40 mt-6">Future network — real data as platform grows</p>
            </div>
          </motion.div>
        </SlideShell>
      );
    }

    case "business":
      return (
        <SlideShell dark>
          <motion.div {...fade} className="max-w-5xl mx-auto w-full">
            <GoldLabel>BUSINESS + SCALE</GoldLabel>
            <h2 className="text-3xl md:text-5xl font-bold mb-10">We grow when tailors grow</h2>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <p className="text-sm text-white/50 uppercase tracking-wider mb-4">Revenue</p>
                {["Transaction Commission", "AI Subscription", "Merchant Pro", "B2B", "Supplier Ecosystem"].map((r) => (
                  <div key={r} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <TrendingUp className="h-4 w-4 text-[#C8A45D]" />
                    <span className="text-sm">{r}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm text-white/50 uppercase tracking-wider mb-4">Expansion</p>
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {["OMAN", "UAE", "Saudi", "Qatar", "Kuwait", "Bahrain"].map((c, i) => (
                    <span key={c} className="flex items-center gap-2">
                      <span className={i === 0 ? "text-[#C8A45D] font-bold" : "text-white/70"}>{c}</span>
                      {i < 5 && <ArrowRight className="h-3 w-3 text-white/30" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </SlideShell>
      );

    case "final":
      return (
        <SlideShell dark className="bg-[#071A33]">
          <motion.div {...fade} className="max-w-4xl mx-auto text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold font-arabic mb-8 leading-snug"
            >
              نحن لا ننافس الخياطين.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#C8A45D] font-arabic mb-12"
            >
              نحن نمكّنهم.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
              <p className="text-2xl md:text-3xl font-bold mb-2 font-arabic">خياطك</p>
              <p className="text-[#C8A45D] text-lg md:text-xl">من أول قياس إلى آخر غرزة... كل شيء أذكى.</p>
              <Link
                href="/customer"
                className="inline-flex items-center gap-2 mt-10 rounded-full bg-[#C8A45D] text-[#071A33] px-8 py-3 font-bold text-sm hover:bg-[#C8A45D]/90 transition-colors"
              >
                افتح المنتج الحي
                <ExternalLink className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </SlideShell>
      );

    case "judge-questions":
      return (
        <SlideShell>
          <motion.div {...fade} className="max-w-5xl mx-auto w-full h-full overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="h-6 w-6 text-[#0F7654]" />
              <GoldLabel>JUDGE Q&A — HIDDEN</GoldLabel>
            </div>
            <div className="space-y-4">
              {JUDGE_QUESTIONS.map((q) => (
                <div key={q.question_ar} className="rounded-xl border border-[#071A33]/10 bg-white p-5">
                  <p className="font-bold font-arabic text-[#0F7654] mb-2">{q.question_ar}</p>
                  <p className="text-sm text-[#101828]/50 mb-2">{q.question_en}</p>
                  <p className="text-sm font-arabic leading-relaxed text-[#101828]/80">{q.answer_ar}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </SlideShell>
      );

    default:
      return null;
  }
}

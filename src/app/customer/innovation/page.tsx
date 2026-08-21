"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Wand2, Loader2, Shirt } from "lucide-react";
import { InnovationStudio } from "@/components/innovation/InnovationStudio";
import { FeatureTutorial } from "@/components/onboarding/FeatureTutorial";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

type GarmentCategory = "abaya" | "dishdasha";

function InnovationPageInner() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const ideaFromQuery = searchParams.get("idea")?.trim() || "";
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [seedIdea, setSeedIdea] = useState<string | null>(null);
  const [initialCategory, setInitialCategory] = useState<GarmentCategory | null>(null);
  const autoStarted = useRef(false);

  const startSession = async (category: GarmentCategory, seed?: string) => {
    setCreating(true);
    try {
      const title =
        seed?.slice(0, 120) ||
        (category === "dishdasha" ? "تصميم دشداشة" : "تصميم عباية");
      const res = await fetch("/api/customer/innovation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category }),
      });
      const data = await res.json();
      if (data.session?.id) {
        setInitialCategory(category);
        if (seed) setSeedIdea(seed);
        setSessionId(data.session.id);
      }
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (autoStarted.current || !ideaFromQuery) return;
    autoStarted.current = true;
    const lower = ideaFromQuery.toLowerCase();
    const category: GarmentCategory =
      /دشداش|dishdasha|thobe|كندور/.test(lower) ? "dishdasha" : "abaya";
    void startSession(category, ideaFromQuery);
  }, [ideaFromQuery]);

  if (sessionId && initialCategory) {
    return (
      <InnovationStudio
        sessionId={sessionId}
        initialIdea={seedIdea}
        initialCategory={initialCategory}
        onBack={() => {
          setSessionId(null);
          setSeedIdea(null);
          setInitialCategory(null);
        }}
      />
    );
  }

  const options: Array<{
    id: GarmentCategory;
    ar: string;
    en: string;
    blurbAr: string;
    blurbEn: string;
    accent: string;
  }> = [
    {
      id: "abaya",
      ar: "عباية",
      en: "Abaya",
      blurbAr: "قصة، أكمام، تطريز، وفتحة — تصميم عباية من فكرتك.",
      blurbEn: "Cut, sleeves, embroidery, and opening — design an abaya from your idea.",
      accent: "from-[#0a1f3a] to-[#12365c]",
    },
    {
      id: "dishdasha",
      ar: "دشداشة",
      en: "Dishdasha",
      blurbAr: "ياقة، كم، طول، وتفاصيل — تصميم دشداشة من فكرتك.",
      blurbEn: "Collar, sleeve, length, and details — design a dishdasha from your idea.",
      accent: "from-[#071A33] to-[#0c2a4d]",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <FeatureTutorial
        featureId="innovation"
        titleAr="أول مرة تستخدم ابتكار؟"
        titleEn="First time using Innovate?"
        bodyAr="اختر نوع القطعة، صف فكرتك، عدّل التصميم، ثم أرسله للخياط لمراجعة إمكانية التنفيذ. المعاينة ليست منتج سوق."
        bodyEn="Choose a garment type, describe your idea, refine the design, then send it to a tailor for feasibility. Preview is not a marketplace product."
      />

      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-navy/5 px-4 py-1.5 text-navy text-xs font-semibold">
          <Wand2 className="h-3.5 w-3.5 text-omani-gold" />
          {t("ابتكار · للجميع", "Innovate · for everyone")}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-navy tracking-tight">
          {t("ماذا تريد أن تبتكر؟", "What do you want to create?")}
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          {t(
            "اختر نوع التصميم، ثم ابدأ بتشكيل فكرتك — عباية أو دشداشة أو ما يُضاف لاحقًا.",
            "Choose a design type, then start shaping your idea — abaya, dishdasha, or more later."
          )}
        </p>
        {ideaFromQuery && (
          <p className="text-xs text-primary max-w-md mx-auto">
            {t("جاري فتح الاستوديو لفكرتك…", "Opening the studio for your idea…")}
          </p>
        )}
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid sm:grid-cols-2 gap-4"
      >
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={creating}
            onClick={() => void startSession(opt.id)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-navy/10 bg-white p-6 text-start shadow-sm",
              "hover:border-omani-gold/50 hover:shadow-md transition-all disabled:opacity-60"
            )}
          >
            <div
              className={cn(
                "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-omani-gold",
                opt.accent
              )}
            >
              <Shirt className="h-7 w-7" />
            </div>
            <p className="text-xl font-bold text-navy">{t(opt.ar, opt.en)}</p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {t(opt.blurbAr, opt.blurbEn)}
            </p>
            <p className="mt-4 text-xs font-medium text-omani-gold group-hover:underline">
              {t("ابدأ التصميم ←", "Start designing →")}
            </p>
          </button>
        ))}
      </motion.div>

      {creating && (
        <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("جاري فتح الاستوديو...", "Opening studio...")}
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground max-w-lg mx-auto">
        {t(
          "التصميم مقترح بالذكاء الاصطناعي. الخياط وحده يؤكد إمكانية التنفيذ والسعر النهائي.",
          "Design is AI-suggested. Only the tailor confirms feasibility and final price."
        )}
      </p>
    </div>
  );
}

export default function InnovationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> ...
        </div>
      }
    >
      <InnovationPageInner />
    </Suspense>
  );
}

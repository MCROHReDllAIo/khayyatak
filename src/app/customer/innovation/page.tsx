"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Wand2, Upload, PenLine, Palette, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InnovationStudio } from "@/components/innovation/InnovationStudio";
import { FeatureTutorial } from "@/components/onboarding/FeatureTutorial";
import { useLocale } from "@/lib/context/locale-context";

function InnovationPageInner() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const ideaFromQuery = searchParams.get("idea")?.trim() || "";
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [seedIdea, setSeedIdea] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const startSession = async (title?: string, seed?: string) => {
    setCreating(true);
    try {
      const res = await fetch("/api/customer/innovation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: (seed || title || "تصميم جديد").slice(0, 120),
        }),
      });
      const data = await res.json();
      if (data.session?.id) {
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
    void startSession(ideaFromQuery, ideaFromQuery);
  }, [ideaFromQuery]);

  if (sessionId) {
    return (
      <InnovationStudio
        sessionId={sessionId}
        initialIdea={seedIdea}
        onBack={() => {
          setSessionId(null);
          setSeedIdea(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4">
      <FeatureTutorial
        featureId="innovation"
        titleAr="أول مرة تستخدم ابتكار؟"
        titleEn="First time using Innovate?"
        bodyAr="صف فكرتك للذكاء، عدّل التصميم، ثم أرسله للخياط لمراجعة إمكانية التنفيذ. المعاينة ليست منتج سوق."
        bodyEn="Describe your idea to AI, refine the design, then send it to a tailor for feasibility. Preview is not a marketplace product."
      />
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-primary text-xs font-semibold">
          <Wand2 className="h-3.5 w-3.5" />
          ابتكار · Innovation Studio
        </div>
        <h1 className="editorial-title text-3xl md:text-4xl">ابتكريها.</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          {t(
            "فكرتك تبدأ منك.\nالتصميم نبنيه معك.",
            "Your idea starts with you.\nWe build the design together."
          )}
        </p>
        {ideaFromQuery && (
          <p className="text-xs text-primary max-w-md mx-auto">
            {t("جاري فتح استوديو لفكرتك…", "Opening studio for your idea…")}
          </p>
        )}
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid sm:grid-cols-3 gap-4"
      >
        {[
          { icon: Upload, ar: "أرفع صورة", en: "Upload image", action: () => startSession("من صورة") },
          { icon: PenLine, ar: "اكتب فكرتي", en: "Write my idea", action: () => startSession("من فكرة") },
          { icon: Wand2, ar: "ابدأ من الصفر", en: "Start blank", action: () => startSession() },
        ].map(({ icon: Icon, ar, en, action }) => (
          <button
            key={ar}
            type="button"
            disabled={creating}
            onClick={action}
            className="group rounded-2xl border-2 border-dashed border-primary/20 bg-white p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Icon className="h-8 w-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-semibold text-navy">{t(ar, en)}</p>
          </button>
        ))}
      </motion.div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" size="sm" className="gap-1" disabled={creating} onClick={() => startSession("لون")}>
          <Palette className="h-3.5 w-3.5" /> {t("استخدم لون", "Use a color")}
        </Button>
        <Button variant="outline" size="sm" className="gap-1" disabled={creating} onClick={() => startSession("قماش")}>
          <ImageIcon className="h-3.5 w-3.5" /> {t("ارفع صورة قماش", "Upload fabric photo")}
        </Button>
      </div>

      {creating && (
        <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("جاري فتح الاستوديو...", "Opening studio...")}
        </div>
      )}

      <p className="text-center text-[10px] text-amber-700 max-w-lg mx-auto">
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

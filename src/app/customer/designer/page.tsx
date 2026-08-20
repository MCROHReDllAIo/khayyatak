"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Users, Wand2, X, RotateCcw, Copy, Trash2, FolderOpen } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";
import { generateDesignFromQuestions } from "@/lib/ai/stylist";
import { applyNaturalLanguageDesign } from "@/lib/ai/concierge";
import type { NLDesignChange } from "@/lib/ai/concierge";
import { GarmentPreview } from "@/components/designer/GarmentPreview";
import { AICopilot } from "@/components/designer/AICopilot";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { Button } from "@/components/ui/button";
import {
  DESIGN_COLORS,
  DESIGN_FABRICS,
  DESIGN_COLLARS,
  DESIGN_ABAYA_STYLES,
  DESIGN_EMBROIDERY,
  GARMENT_TYPES,
  type DesignConfig,
  type GarmentType,
} from "@/types";
import { cn } from "@/lib/utils";

const SLEEVES = [
  { key: "long", ar: "طويلة" },
  { key: "wide", ar: "واسعة" },
  { key: "slim", ar: "ضيقة" },
];
const BUTTONS = [
  { key: "hidden", ar: "مخفية" },
  { key: "gold", ar: "ذهبية" },
  { key: "pearl", ar: "لؤلؤ" },
];
const LENGTHS = [
  { key: "standard", ar: "قياسي" },
  { key: "long", ar: "طويل" },
  { key: "ankle", ar: "كاحل" },
];

function ControlSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-5 fashion-divider first:border-0 first:pt-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">{label}</p>
      {children}
    </div>
  );
}

function PillOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm border transition-all",
        active ? "border-navy bg-navy text-white" : "border-border/60 hover:border-navy/30 text-navy/80"
      )}
    >
      {children}
    </button>
  );
}

export default function DesignerPage() {
  const { t, locale } = useLocale();
  const {
    design,
    setDesign,
    resetDesign,
    savedDesigns,
    saveDesign,
    loadDesign,
    duplicateDesign,
    deleteDesign,
    pendingIntentDesign,
    setPendingIntentDesign,
    recordStyleEvent,
  } = useAppState();

  const [aiModal, setAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [nlPrompt, setNlPrompt] = useState("");
  const [nlChanges, setNlChanges] = useState<NLDesignChange[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (pendingIntentDesign) {
      setDesign(pendingIntentDesign);
      setPendingIntentDesign(null);
    }
  }, [pendingIntentDesign, setDesign, setPendingIntentDesign]);

  const updateDesign = (updates: Partial<DesignConfig>) => {
    const next = { ...design, ...updates };
    setDesign(next);
    recordStyleEvent({
      colorKey: next.colorKey,
      fabricKey: next.fabricKey,
      fitKey: next.fitKey,
      garmentType: next.garmentType,
    });
  };

  const isAbaya = design.garmentType === "abaya";
  const styleOptions = isAbaya ? DESIGN_ABAYA_STYLES : DESIGN_COLLARS;

  const setGarmentType = (type: GarmentType) => {
    const defaultCollar = type === "abaya" ? DESIGN_ABAYA_STYLES[0] : DESIGN_COLLARS[0];
    updateDesign({
      garmentType: type,
      collarKey: defaultCollar.key,
      collar: defaultCollar.ar,
      name: type === "abaya" ? "عباية" : "دشداشة",
    });
  };

  const handleAiDesign = async () => {
    setAiLoading(true);
    const rec = await generateDesignFromQuestions({
      garment: design.garmentType === "abaya" ? "عباية" : "دشداشة عمانية",
      occasion: "مناسبة رسمية",
      color: design.color,
      budget: "15-20 ر.ع",
      style: "رسمي",
    });
    setDesign({
      garmentType: rec.garmentType,
      color: rec.color,
      colorKey: rec.colorKey,
      fabric: rec.fabric,
      fabricKey: rec.fabricKey,
      collar: rec.collar,
      collarKey: rec.collarKey,
      embroidery: rec.embroidery,
      embroideryKey: rec.embroideryKey,
      name: "AI Recommended",
    });
    setAiLoading(false);
    setAiModal(false);
  };

  const handleNlDesign = () => {
    if (!nlPrompt.trim()) return;
    const { design: updated, changes } = applyNaturalLanguageDesign(nlPrompt, design);
    setDesign(updated);
    setNlChanges(changes);
    setNlPrompt("");
    recordStyleEvent({ colorKey: updated.colorKey, fabricKey: updated.fabricKey, fitKey: updated.fitKey });
  };

  const handleSave = async () => {
    const saved = await saveDesign();
    if (saved) {
      setSaveMsg(t(`تم الحفظ: ${saved.name}`, `Saved: ${saved.name}`));
      setTimeout(() => setSaveMsg(""), 2500);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <header className="mb-8 md:mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary mb-2">AI Design Studio</p>
          <h1 className="editorial-title">{t("استوديو التصميم", "Design Studio")}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}><Save className="h-3.5 w-3.5" />{t("حفظ", "Save")}</Button>
          <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}><FolderOpen className="h-3.5 w-3.5" />{t("محفوظ", "Saved")}</Button>
          <Button variant="outline" size="sm" onClick={resetDesign}><RotateCcw className="h-3.5 w-3.5" />{t("إعادة", "Reset")}</Button>
        </div>
      </header>

      {saveMsg && <p className="text-sm text-primary mb-4">{saveMsg}</p>}

      {showSaved && (
        <div className="mb-6 rounded-xl border p-4 space-y-2">
          {savedDesigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("لا توجد تصاميم محفوظة", "No saved designs")}</p>
          ) : (
            savedDesigns.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <button type="button" className="font-medium hover:text-primary" onClick={() => loadDesign(s.id)}>
                  {s.name}
                </button>
                <div className="flex gap-1">
                  <button type="button" onClick={() => duplicateDesign(s.id)} title="Duplicate"><Copy className="h-4 w-4" /></button>
                  <button type="button" onClick={() => deleteDesign(s.id)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(240px,280px)_1fr_minmax(260px,300px)] gap-0 bg-white rounded-3xl border border-border/40 overflow-hidden min-h-[560px]">
        <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-e border-border/40 overflow-y-auto max-h-[50vh] lg:max-h-none">
          <ControlSection label={t("نوع القطعة", "Garment")}>
            <div className="flex flex-wrap gap-2">
              {GARMENT_TYPES.map((g) => (
                <PillOption key={g.key} active={design.garmentType === g.key} onClick={() => setGarmentType(g.key)}>
                  {locale === "ar" ? g.ar : g.en}
                </PillOption>
              ))}
            </div>
          </ControlSection>
          <ControlSection label={t("اللون", "Color")}>
            <div className="flex flex-wrap gap-2">
              {DESIGN_COLORS.map((c) => (
                <PillOption key={c.key} active={design.colorKey === c.key} onClick={() => updateDesign({ colorKey: c.key, color: c.ar })}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border" style={{ background: c.hex }} />
                    {locale === "ar" ? c.ar : c.en}
                  </span>
                </PillOption>
              ))}
            </div>
          </ControlSection>
          <ControlSection label={t("القماش", "Fabric")}>
            <div className="flex flex-wrap gap-2">
              {DESIGN_FABRICS.map((f) => (
                <PillOption key={f.key} active={design.fabricKey === f.key} onClick={() => updateDesign({ fabricKey: f.key, fabric: f.ar })}>
                  {locale === "ar" ? f.ar : f.en}
                </PillOption>
              ))}
            </div>
          </ControlSection>
          <ControlSection label={isAbaya ? t("القصة", "Cut") : t("الياقة", "Collar")}>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map((c) => (
                <PillOption key={c.key} active={design.collarKey === c.key} onClick={() => updateDesign({ collarKey: c.key, collar: c.ar })}>
                  {locale === "ar" ? c.ar : c.en}
                </PillOption>
              ))}
            </div>
          </ControlSection>
          <ControlSection label={t("الأكمام", "Sleeves")}>
            <div className="flex flex-wrap gap-2">
              {SLEEVES.map((s) => (
                <PillOption key={s.key} active={design.sleevesKey === s.key} onClick={() => updateDesign({ sleevesKey: s.key, sleeves: s.ar })}>
                  {s.ar}
                </PillOption>
              ))}
            </div>
          </ControlSection>
          <ControlSection label={t("الأزرار", "Buttons")}>
            <div className="flex flex-wrap gap-2">
              {BUTTONS.map((b) => (
                <PillOption key={b.key} active={design.buttonsKey === b.key} onClick={() => updateDesign({ buttonsKey: b.key, buttons: b.ar })}>
                  {b.ar}
                </PillOption>
              ))}
            </div>
          </ControlSection>
          <ControlSection label={t("التطريز", "Embroidery")}>
            <div className="flex flex-wrap gap-2">
              {DESIGN_EMBROIDERY.map((e) => (
                <PillOption key={e.key} active={design.embroideryKey === e.key} onClick={() => updateDesign({ embroideryKey: e.key, embroidery: e.ar })}>
                  {locale === "ar" ? e.ar : e.en}
                </PillOption>
              ))}
            </div>
          </ControlSection>
          <ControlSection label={t("الطول", "Length")}>
            <div className="flex flex-wrap gap-2">
              {LENGTHS.map((l) => (
                <PillOption key={l.key} active={design.lengthKey === l.key} onClick={() => updateDesign({ lengthKey: l.key, length: l.ar })}>
                  {l.ar}
                </PillOption>
              ))}
            </div>
          </ControlSection>
          <Link href="/customer/tailors">
            <Button size="sm" variant="outline" className="w-full mt-2"><Users className="h-3.5 w-3.5" />{t("اختر خياط", "Choose tailor")}</Button>
          </Link>
        </div>

        <div className="relative flex flex-col items-center justify-center py-10 px-6 bg-omani-cream/40 min-h-[360px]">
          <GeometricPattern className="text-navy opacity-20" />
          <motion.div
            key={`${design.colorKey}-${design.fabricKey}-${design.collarKey}-${design.embroideryKey}-${design.garmentType}-${design.sleevesKey}`}
            initial={{ opacity: 0.6, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="relative z-10"
          >
            <GarmentPreview design={design} size="lg" />
          </motion.div>
          <p className="relative z-10 mt-6 text-center">
            <span className="block text-lg font-semibold text-navy">{design.color} · {design.fabric}</span>
            <span className="text-sm text-muted-foreground">
              {[design.collar, design.embroidery, design.sleeves, design.length].filter(Boolean).join(" · ")}
            </span>
          </p>
        </div>

        <div className="p-6 md:p-8 border-t lg:border-t-0 lg:border-s border-border/40">
          <AICopilot
            design={design}
            onDesignChange={(d, c) => { setDesign(d); setNlChanges(c); }}
            nlChanges={nlChanges}
            nlPrompt={nlPrompt}
            onPromptChange={setNlPrompt}
            onApply={handleNlDesign}
          />
        </div>
      </div>

      <button type="button" onClick={() => setAiModal(true)} className="fixed bottom-24 md:bottom-8 start-4 z-30 rounded-full bg-navy px-5 py-3 text-sm text-white md:hidden">✨ AI</button>

      <AnimatePresence>
        {aiModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={() => setAiModal(false)}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} className="w-full max-w-md rounded-t-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between mb-4">
                <h3 className="font-bold">{t("صمّم لي", "Design for me")}</h3>
                <button type="button" onClick={() => setAiModal(false)}><X className="h-5 w-5" /></button>
              </div>
              <Button className="w-full gap-2" onClick={handleAiDesign} disabled={aiLoading}>
                <Wand2 className="h-4 w-4" />
                {aiLoading ? "..." : t("إنشاء", "Generate")}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

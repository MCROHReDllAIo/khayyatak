"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Wand2 } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/context/locale-context";
import { useAppState } from "@/lib/context/app-context";
import { generateStyleRecommendation } from "@/lib/ai/stylist";
import type { StyleRecommendation } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GarmentPreview } from "@/components/designer/GarmentPreview";

export default function AIStylistPage() {
  const { t } = useLocale();
  const { setDesign } = useAppState();
  const [prompt, setPrompt] = useState("أريد دشداشة عمانية بيضاء رسمية — أو عباية سوداء للدوام");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StyleRecommendation | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const rec = await generateStyleRecommendation(prompt);
    setResult(rec);
    setLoading(false);
  };

  const applyDesign = () => {
    if (!result) return;
    setDesign({
      garmentType: result.garmentType,
      color: result.color,
      colorKey: result.colorKey,
      fabric: result.fabric,
      fabricKey: result.fabricKey,
      collar: result.collar,
      collarKey: result.collarKey,
      embroidery: result.embroidery,
      embroideryKey: result.embroideryKey,
      name: "تصميم AI",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          {t("مساعد التصميم الذكي", "AI Style Assistant")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("صف دشداشتك أو عبايتك بالكلمات وسيقترح AI التصميم المناسب", "Describe your dishdasha or abaya and AI will suggest the perfect design")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("أريد دشداشة بيضاء رسمية... أو عباية سوداء...", "I want a formal white dishdasha... or black abaya...")}
          className="flex-1"
        />
        <Button type="submit" disabled={loading} className="gap-2 shrink-0">
          {loading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <Sparkles className="h-4 w-4" />
            </motion.div>
          ) : (
            <Send className="h-4 w-4" />
          )}
          {t("اسأل AI", "Ask AI")}
        </Button>
      </form>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <GarmentPreview
                  design={{
                    garmentType: result.garmentType,
                    color: result.color,
                    colorKey: result.colorKey,
                    fabric: result.fabric,
                    fabricKey: result.fabricKey,
                    collar: result.collar,
                    collarKey: result.collarKey,
                    embroidery: result.embroidery,
                    embroideryKey: result.embroideryKey,
                  }}
                  size="md"
                />
                <div>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                    AI Recommended
                  </span>
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{result.message_ar}</p>
                  <ul className="mt-4 space-y-1">
                    {result.reasons_ar.map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="text-primary">✓</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={applyDesign} className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  {t("إنشاء التصميم", "Create Design")}
                </Button>
                <Link href="/customer/designer">
                  <Button variant="outline">{t("فتح المصمم", "Open Designer")}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

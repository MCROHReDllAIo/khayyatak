"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";
import { analyzeGarmentImage, analysisToDesignConfig } from "@/lib/ai/image-understanding";
import type { ImageAnalysisResult } from "@/lib/ai/image-understanding";
import { useAppState } from "@/lib/context/app-context";
import { ImageUploader } from "@/components/ai/ImageUploader";
import { INSPIRATION_KEY } from "@/components/ai/ConciergeInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/context/locale-context";

export default function ImageAIPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { setDesign, recordStyleEvent } = useAppState();
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const handleImage = async (dataUrl: string, hint?: string) => {
    setPreview(dataUrl);
    setAnalyzing(true);
    setResult(null);
    const analysis = await analyzeGarmentImage(dataUrl, hint);
    setResult(analysis);
    setAnalyzing(false);
  };

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const saved = sessionStorage.getItem(INSPIRATION_KEY);
      if (saved) handleImage(saved, "من Concierge");
    } catch {
      /* ignore */
    }
  }, []);

  const applyDesign = () => {
    if (!result) return;
    const config = analysisToDesignConfig(result);
    setDesign(config);
    recordStyleEvent({ colorKey: config.colorKey, fabricKey: config.fabricKey, garmentType: config.garmentType });
    router.push("/customer/designer");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="editorial-title">{t("تحليل الصورة", "AI Image Understanding")}</h1>
      <ImageUploader onImageSelected={handleImage} />
      {preview && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="rounded-xl max-h-48 mx-auto object-contain border" />
          <Button variant="ghost" size="sm" className="mx-auto block" onClick={() => { setPreview(null); setResult(null); }}>{t("إزالة", "Remove")}</Button>
        </>
      )}
      {analyzing && <p className="text-center text-sm animate-pulse">{t("جاري التحليل...", "Analyzing...")}</p>}
      {result && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold mb-4">{t("ما فهمه AI", "What AI understood")}{" "}
              <span className="text-xs text-primary">{result.usedRealAI ? "OpenRouter AI" : "Built-in AI"} {result.confidence}%</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div><span className="text-muted-foreground">النوع</span><p>{result.garmentType}</p></div>
              <div><span className="text-muted-foreground">القماش</span><p>{result.fabric}</p></div>
              <div><span className="text-muted-foreground">اللون</span><p>{result.colors.join(", ")}</p></div>
              <div><span className="text-muted-foreground">التطريز</span><p>{result.embroidery}</p></div>
            </div>
            <Button onClick={applyDesign} className="gap-2"><Wand2 className="h-4 w-4" />{t("تحويل إلى تصميم", "Convert to Design")}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

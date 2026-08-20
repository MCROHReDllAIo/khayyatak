"use client";

import { useState, useRef } from "react";
import { Upload, Shield, Check, AlertCircle } from "lucide-react";
import { analyzeQualityImage } from "@/lib/ai/image-understanding";
import { useAppState } from "@/lib/context/app-context";
import { AIStatusBadge } from "@/components/ai/AIStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/context/locale-context";

export default function QualityPage() {
  const { t } = useLocale();
  const { design } = useAppState();
  const [result, setResult] = useState<{ pass: number; issue?: string; usedRealAI: boolean } | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setScanning(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const expected = `${design.garmentType} ${design.color} ${design.fabric} ${design.embroidery}`;
      const analysis = await analyzeQualityImage(dataUrl, expected);
      setResult(analysis);
      setScanning(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          {t("فحص الجودة AI", "AI Quality Control")}
        </h1>
        <AIStatusBadge />
      </div>
      <p className="text-sm text-amber-700">{t("مساعد فحص — ليس شهادة صناعية", "AI-assisted — not certified QC")}</p>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      <Card>
        <CardContent className="p-6 text-center">
          <label className="cursor-pointer block border-2 border-dashed rounded-xl p-8 hover:bg-muted/50" onClick={() => fileRef.current?.click()}>
            <Upload className="h-10 w-10 mx-auto text-primary mb-2" />
            <p>{t("ارفع صورة القطعة الجاهزة", "Upload finished garment photo")}</p>
          </label>
        </CardContent>
      </Card>

      {scanning && <p className="text-center text-sm animate-pulse">{t("جاري الفحص...", "Checking...")}</p>}

      {result && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Check className="h-6 w-6 text-primary" />
              <span className="font-bold">{t("Quality Check", "Quality Check")}: {result.pass}%</span>
              <span className="text-xs text-muted-foreground">({result.usedRealAI ? "OpenRouter" : "Demo AI"})</span>
            </div>
            <Progress value={result.pass} className="mb-4" />
            {result.issue && (
              <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {result.issue}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

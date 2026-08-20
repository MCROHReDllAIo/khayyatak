"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, Sparkles, Save, Check } from "lucide-react";
import { useAppState } from "@/lib/context/app-context";
import { GarmentPreview } from "@/components/designer/GarmentPreview";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/context/locale-context";

export default function TryOnPage() {
  const { t } = useLocale();
  const { design, tryOnPreview, setTryOnPreview } = useAppState();
  const [photo, setPhoto] = useState<string | null>(tryOnPreview);
  const [previewReady, setPreviewReady] = useState(!!tryOnPreview);
  const [saved, setSaved] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
      setPreviewReady(false);
      setSaved(false);
      setTimeout(() => setPreviewReady(true), 1500);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (photo) {
      setTryOnPreview(photo);
      setSaved(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="editorial-title">{t("تجربة افتراضية", "Virtual Try-On")}</h1>
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">
          {t("AI Preview — محاكاة — ليست دقة فوتográfica", "AI Preview — simulation — not photorealistic")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-5">
          <p className="text-sm font-medium mb-3">{t("صورتك", "Your Photo")}</p>
          {photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="rounded-xl w-full aspect-[3/4] object-cover" />
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setPhoto(null); setPreviewReady(false); }}>{t("إزالة", "Remove")}</Button>
            </>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl h-64 cursor-pointer hover:bg-muted/50">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">{t("ارفع صورة", "Upload photo")}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          )}
        </div>

        <div className="rounded-2xl border p-5 flex flex-col items-center">
          <p className="text-sm font-medium mb-3 self-start">{t("معاينة AI", "AI Preview")}</p>
          {photo && !previewReady && (
            <div className="flex flex-col items-center py-12">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              <p className="text-sm mt-2">{t("جاري إنشاء المعاينة...", "Generating preview...")}</p>
            </div>
          )}
          {previewReady && photo && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="rounded-xl w-full max-w-[200px] opacity-40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <GarmentPreview design={design} size="sm" />
              </div>
            </div>
          )}
          {!photo && <GarmentPreview design={design} size="md" />}
        </div>
      </div>

      <div className="flex gap-2">
        <Link href="/customer/designer"><Button variant="outline">{t("غيّر التصميم", "Change Design")}</Button></Link>
        <Button disabled={!previewReady || !photo} className="gap-2" onClick={handleSave}>
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? t("تم الحفظ", "Saved") : t("حفظ المعاينة", "Save Preview")}
        </Button>
      </div>
    </div>
  );
}

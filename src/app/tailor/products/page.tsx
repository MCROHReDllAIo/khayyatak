"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, Check } from "lucide-react";
import { generateProductFromHint } from "@/lib/ai/image-understanding";
import { useAppState } from "@/lib/context/app-context";
import { AIStatusBadge } from "@/components/ai/AIStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/context/locale-context";

export default function ProductCreatorPage() {
  const { t } = useLocale();
  const { products, addProduct, selectedTailorId } = useAppState();
  const [draft, setDraft] = useState<{ id?: string; name: string; description: string; price: string; tags: string[] } | null>(null);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usedRealAI, setUsedRealAI] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const generate = async (hint?: string) => {
    setLoading(true);
    const result = await generateProductFromHint(hint);
    setDraft({
      name: result.name,
      description: result.description,
      price: result.price,
      tags: result.tags,
    });
    setUsedRealAI(result.usedRealAI);
    setPublished(false);
    setLoading(false);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => generate(`منتج من صورة: ${file.name}`);
    reader.readAsDataURL(file);
  };

  const publish = async () => {
    if (!draft) return;
    const p = await addProduct({
      tailor_id: selectedTailorId ?? "",
      name_ar: draft.name,
      description_ar: draft.description,
      category: "رجال / دشداشة",
      tags: draft.tags,
      price: parseFloat(draft.price),
      fabric: draft.tags.find((x) => ["كتان", "قطن", "صيفي"].includes(x)) ?? "كتان",
      style: draft.tags[0] ?? "رسمي",
      occasion: "مناسبات",
      published: true,
    });
    if (!p) return;
    setDraft({ ...draft, id: p.id });
    setPublished(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="editorial-title">{t("منشئ المنتجات AI", "AI Product Creator")}</h1>
        <AIStatusBadge />
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/30"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto text-primary mb-2" />
        <p className="text-sm">{t("ارفع صورة أو انقر للإنشاء", "Upload or click to generate")}</p>
      </div>
      <Button onClick={() => generate()} disabled={loading} className="w-full gap-2">
        <Sparkles className="h-4 w-4" />
        {loading ? t("جاري الإنشاء...", "Generating...") : t("إنشاء بالذكاء الاصطناعي", "AI Generate")}
      </Button>
      {draft && (
        <div className="rounded-xl border p-5 space-y-3">
          <p className="text-xs text-muted-foreground">{usedRealAI ? "OpenRouter AI" : "Demo AI"}</p>
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <Input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          <Button onClick={publish} disabled={published} className="gap-2">
            {published ? <Check className="h-4 w-4" /> : null}
            {published ? t("تم النشر", "Published") : t("نشر المنتج", "Publish")}
          </Button>
        </div>
      )}
      {products.filter((p) => p.published).length > 0 && (
        <div>
          <h3 className="font-bold mb-2">{t("منتجات منشورة", "Published")}</h3>
          {products.filter((p) => p.published).map((p) => (
            <div key={p.id} className="text-sm border rounded-lg p-3 mb-2">{p.name_ar} — {p.price} ر.ع</div>
          ))}
        </div>
      )}
    </div>
  );
}

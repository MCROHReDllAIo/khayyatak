"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, Check, AlertTriangle } from "lucide-react";
import { generateProductFromHint } from "@/lib/ai/image-understanding";
import { useAppState } from "@/lib/context/app-context";
import { AIStatusBadge } from "@/components/ai/AIStatusBadge";
import { ProductImageEmpty } from "@/components/shared/ProductImageEmpty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/context/locale-context";

export default function ProductCreatorPage() {
  const { t } = useLocale();
  const { products, addProduct, selectedTailorId } = useAppState();
  const [draft, setDraft] = useState<{
    id?: string;
    name: string;
    description: string;
    price: string;
    tags: string[];
    imagePreview?: string | null;
  } | null>(null);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usedRealAI, setUsedRealAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const generate = async (hint?: string) => {
    setLoading(true);
    setError(null);
    const result = await generateProductFromHint(hint);
    setDraft((prev) => ({
      name: result.name,
      description: result.description,
      price: result.price,
      tags: result.tags,
      imagePreview: prev?.imagePreview ?? null,
    }));
    setUsedRealAI(result.usedRealAI);
    setPublished(false);
    setLoading(false);
  };

  const handleFile = (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t("صيغة غير مدعومة — استخدم JPEG أو PNG أو WEBP", "Use JPEG, PNG, or WEBP only"));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(t("الصورة أكبر من 8MB", "Image must be under 8MB"));
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setDraft((prev) =>
        prev
          ? { ...prev, imagePreview: dataUrl }
          : {
              name: "",
              description: "",
              price: "",
              tags: [],
              imagePreview: dataUrl,
            }
      );
      generate(`منتج من صورة حقيقية: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const publish = async () => {
    if (!draft) return;
    if (!draft.imagePreview) {
      setError(
        t(
          "ارفع صورة حقيقية للمنتج قبل النشر — لا يُسمح بالنشر بدون صورة",
          "Upload a real product photo before publishing"
        )
      );
      return;
    }
    setError(null);
    // Note: durable storage upload (Supabase/Railway bucket) still required for production;
    // without storage, keep unpublished until image_url is a real stored URL.
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
      published: false,
    });
    if (!p) {
      setError(t("فشل الحفظ — تأكد من الاتصال بقاعدة البيانات", "Save failed — check database"));
      return;
    }
    setDraft({ ...draft, id: p.id });
    setPublished(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="editorial-title">{t("منشئ المنتجات", "Product creator")}</h1>
        <AIStatusBadge />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950 flex gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          {t(
            "يُنشر المنتج للعملاء فقط بعد رفع صورة حقيقية من الخياط. لا نستخدم صور مخزون أو رسوم SVG كمنتجات.",
            "Products go live only with a real tailor photo. No stock images or SVG garments as products."
          )}
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/30 overflow-hidden"
        onClick={() => fileRef.current?.click()}
      >
        {draft?.imagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.imagePreview} alt="" className="mx-auto max-h-48 rounded-lg object-cover" />
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-sm">{t("ارفع صورة المنتج الحقيقية", "Upload the real product photo")}</p>
          </>
        )}
      </div>

      <Button onClick={() => generate()} disabled={loading} variant="outline" className="w-full gap-2">
        <Sparkles className="h-4 w-4" />
        {loading ? t("جاري الإنشاء...", "Generating...") : t("اقتراح وصف بالذكاء الاصطناعي", "AI suggest description")}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {draft && (
        <div className="rounded-xl border p-5 space-y-3">
          <div className="aspect-[4/5] max-w-xs mx-auto rounded-xl overflow-hidden border">
            {draft.imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.imagePreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <ProductImageEmpty />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {usedRealAI ? "OpenRouter AI" : t("وصف مقترح — راجع قبل الحفظ", "Suggested copy — review before save")}
          </p>
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <Input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          <Button onClick={publish} disabled={published} className="gap-2 w-full">
            {published ? <Check className="h-4 w-4" /> : null}
            {published
              ? t("تم الحفظ (بانتظار صورة مخزّنة للنشر)", "Saved (needs stored image to publish)")
              : t("حفظ كمسودة", "Save as draft")}
          </Button>
        </div>
      )}

      {products.filter((p) => p.published).length > 0 && (
        <div>
          <h3 className="font-bold mb-2">{t("منتجات منشورة", "Published")}</h3>
          {products
            .filter((p) => p.published)
            .map((p) => (
              <div key={p.id} className="text-sm border rounded-lg p-3 mb-2">
                {p.name_ar} — {p.price} ر.ع
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

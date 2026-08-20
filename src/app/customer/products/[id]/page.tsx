"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Store, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatOMR } from "@/lib/utils";
import type { MatchedProduct } from "@/lib/db/products";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [product, setProduct] = useState<MatchedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/customer/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.product) setProduct(d.product);
        else setError(d.error ?? "Not found");
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">جاري التحميل...</div>;
  }

  if (error || !product) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-muted-foreground">{error ?? "المنتج غير موجود"}</p>
        <Link href="/customer/ai"><Button variant="outline">العودة للمساعد</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/customer/ai" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowRight className="h-4 w-4" /> العودة للمساعد
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl overflow-hidden bg-omani-cream aspect-[4/5]">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name_ar} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">لا توجد صورة</div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-primary font-semibold mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              منتج حقيقي · AI Match {product.match_score}%
            </div>
            <h1 className="editorial-title">{product.name_ar}</h1>
            {product.name_en && <p className="text-muted-foreground">{product.name_en}</p>}
          </div>

          <p className="text-2xl font-bold text-primary">{formatOMR(product.price)}</p>

          <div className="space-y-2 text-sm">
            {product.fabric && <p><span className="text-muted-foreground">القماش:</span> {product.fabric}</p>}
            {product.style && <p><span className="text-muted-foreground">القصة:</span> {product.style}</p>}
            {product.color && <p><span className="text-muted-foreground">اللون:</span> {product.color}</p>}
            {product.occasion && <p><span className="text-muted-foreground">المناسبة:</span> {product.occasion}</p>}
            {product.tailor_name_ar && (
              <p className="flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                {product.tailor_name_ar}
                {product.tailor_rating > 0 && ` · ${product.tailor_rating.toFixed(1)}`}
              </p>
            )}
            <p className="flex items-center gap-2">
              <CheckCircle2 className={`h-4 w-4 ${product.available ? "text-emerald-600" : "text-red-500"}`} />
              {product.available ? "متوفر" : "غير متوفر"}
            </p>
          </div>

          {product.description_ar && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description_ar}</p>
          )}

          <div className="flex flex-wrap gap-3 pt-4">
            <Button onClick={() => router.push(`/customer/ai?q=${encodeURIComponent(`أبغى ${product.name_ar}`)}`)}>
              اسأل المساعد
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/customer/ai?product=${product.id}`)
              }
            >
              نظرة افتراضية
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

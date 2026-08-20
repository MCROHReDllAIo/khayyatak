"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Store, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatOMR } from "@/lib/utils";
import type { MatchedProduct } from "@/lib/db/products";

interface ChatProductCardProps {
  product: MatchedProduct;
  onSelect?: (product: MatchedProduct) => void;
  onVirtualLook?: (product: MatchedProduct) => void;
  onSize?: (product: MatchedProduct) => void;
  compact?: boolean;
}

export function ChatProductCard({
  product,
  onSelect,
  onVirtualLook,
  onSize,
  compact,
}: ChatProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm rounded-2xl border border-primary/15 bg-white shadow-card overflow-hidden"
    >
      <div className="relative aspect-[4/5] bg-omani-cream">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name_ar}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            لا توجد صورة
          </div>
        )}
        <div className="absolute top-3 start-3 flex items-center gap-1 rounded-full bg-navy/90 px-2.5 py-1 text-[10px] font-semibold text-white">
          <Sparkles className="h-3 w-3 text-primary" />
          AI Match {product.match_score}%
        </div>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-navy leading-snug">{product.name_ar}</h3>
        {product.name_en && (
          <p className="text-xs text-muted-foreground">{product.name_en}</p>
        )}

        {!compact && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {product.fabric && <span>القماش: {product.fabric}</span>}
            {product.style && <span>القصة: {product.style}</span>}
            {product.color && <span>اللون: {product.color}</span>}
            {product.tailor_name_ar && (
              <span className="flex items-center gap-1 col-span-2">
                <Store className="h-3 w-3" />
                {product.tailor_name_ar}
                {product.tailor_rating > 0 && ` · ${product.tailor_rating.toFixed(1)}`}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-lg font-bold text-primary">{formatOMR(product.price)}</p>
          <span className="flex items-center gap-1 text-xs">
            {product.available ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                متوفر
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                غير متوفر
              </>
            )}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {onSize && (
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => onSize(product)}>
              اختيار المقاس
            </Button>
          )}
          {onVirtualLook && (
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => onVirtualLook(product)}>
              نظرة افتراضية
            </Button>
          )}
          <Link href={`/customer/products/${product.id}`}>
            <Button size="sm" variant="ghost" className="text-xs h-8">
              تفاصيل المنتج
            </Button>
          </Link>
          {onSelect && (
            <Button size="sm" className="text-xs h-8 ms-auto" onClick={() => onSelect(product)}>
              اختيار
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

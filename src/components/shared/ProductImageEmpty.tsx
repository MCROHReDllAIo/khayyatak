"use client";

import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/context/locale-context";

/** Honest empty state — never invent a clothing photo */
export function ProductImageEmpty({
  className,
  messageAr = "لا توجد صورة للمنتج",
  messageEn = "No product photo",
}: {
  className?: string;
  messageAr?: string;
  messageEn?: string;
}) {
  const { t } = useLocale();
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 text-muted-foreground",
        className
      )}
    >
      <ImageOff className="h-8 w-8 opacity-40" />
      <p className="text-sm font-medium text-center px-4">{t(messageAr, messageEn)}</p>
    </div>
  );
}

export function ImageUnavailable({ className }: { className?: string }) {
  return (
    <ProductImageEmpty
      className={className}
      messageAr="الصورة غير متوفرة"
      messageEn="Image unavailable"
    />
  );
}

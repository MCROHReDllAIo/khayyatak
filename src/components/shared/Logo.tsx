"use client";

import Link from "next/link";
import { useLocale } from "@/lib/context/locale-context";
import { BRAND } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  showTagline?: boolean;
  /** default = light backgrounds · light = dark/navy backgrounds */
  variant?: "default" | "light";
  size?: "sm" | "md" | "lg";
}

function BrandMark({ size }: { size: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const text = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";

  return (
    <div
      className={cn(
        "relative shrink-0 rounded-xl p-[1.5px] shadow-[0_2px_12px_-2px_rgba(7,26,51,0.35)]",
        "bg-gradient-to-br from-omani-gold via-primary to-navy",
        dim
      )}
      aria-hidden
    >
      <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-gradient-to-br from-navy via-[#0a2240] to-[#0F7654]">
        <span className={cn("font-bold font-arabic leading-none text-omani-gold", text)}>خ</span>
      </div>
      <div className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-omani-gold ring-2 ring-white/90" />
    </div>
  );
}

export function Logo({
  className,
  showText = true,
  showTagline = false,
  variant = "default",
  size = "md",
}: LogoProps) {
  const { t } = useLocale();
  const isLight = variant === "light";

  const nameSize =
    size === "sm" ? "text-sm" : size === "lg" ? "text-xl md:text-2xl" : "text-base";

  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      {showText && (
        <div className="flex flex-col leading-tight min-w-0">
          <span
            className={cn(
              "font-bold tracking-tight font-arabic",
              nameSize,
              isLight ? "text-white" : "text-navy",
              "group-hover:text-primary transition-colors"
            )}
          >
            {t(BRAND.nameAr, BRAND.nameEn)}
          </span>
          {showTagline ? (
            <span
              className={cn(
                "text-[10px] md:text-xs mt-0.5 truncate",
                isLight ? "text-white/55" : "text-muted-foreground"
              )}
            >
              {t(BRAND.taglineAr, BRAND.taglineEn)}
            </span>
          ) : (
            <span
              className={cn(
                "text-[10px] font-medium tracking-wide uppercase",
                isLight ? "text-omani-gold/90" : "text-primary/80"
              )}
            >
              {t("خياطة عمانية ذكية", "Smart Omani Tailoring")}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

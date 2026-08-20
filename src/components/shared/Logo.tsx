"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
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

const SIZE_PX = { sm: 36, md: 44, lg: 56 } as const;

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
    <Link href="/" className={cn("group flex items-center gap-2.5 min-w-0", className)}>
      <BrandLogo href={false} size={SIZE_PX[size]} className="rounded-lg" priority={size === "lg"} />
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
                "text-[10px] font-medium tracking-[0.22em] uppercase",
                isLight ? "text-omani-gold/90" : "text-primary/80"
              )}
            >
              kytk
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

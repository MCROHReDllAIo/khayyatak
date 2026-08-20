"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants/brand";

export const BRAND_LOGO_SRC = "/brand/khayyatak-logo.png";

interface BrandLogoProps {
  className?: string;
  /** Image box size */
  size?: number;
  priority?: boolean;
  alt?: string;
  /** Link to home when true */
  href?: string | false;
}

/** Official Khayyatak mark (dishdasha + خياطك + kytk) */
export function BrandLogo({
  className,
  size = 48,
  priority,
  alt = BRAND.nameAr,
  href = "/",
}: BrandLogoProps) {
  const img = (
    <Image
      src={BRAND_LOGO_SRC}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={cn("object-contain select-none", className)}
      style={{ width: size, height: size }}
    />
  );

  if (href === false) return img;
  return (
    <Link href={href} className="inline-flex shrink-0" aria-label={BRAND.nameAr}>
      {img}
    </Link>
  );
}

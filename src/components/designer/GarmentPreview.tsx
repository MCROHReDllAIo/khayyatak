"use client";

import { motion } from "framer-motion";
import type { DesignConfig } from "@/types";
import { DESIGN_COLORS, GARMENT_TYPES } from "@/types";
import { cn } from "@/lib/utils";

interface GarmentPreviewProps {
  design: DesignConfig;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function AbayaSvg({
  design,
  colorHex,
  hasEmbroidery,
  embroideryColor,
}: {
  design: DesignConfig;
  colorHex: string;
  hasEmbroidery: boolean;
  embroideryColor: string;
}) {
  const stroke = colorHex === "#FFFFFF" || colorHex === "#F5F0E8" ? "#E5E0D8" : "rgba(0,0,0,0.1)";

  return (
    <>
      {/* Flowing abaya body — wider, longer silhouette */}
      <path
        d="M55 75 L45 95 L38 140 L35 200 L32 310 L168 310 L165 200 L162 140 L155 95 L145 75 L130 68 L100 65 L70 68 Z"
        fill={colorHex}
        stroke={stroke}
        strokeWidth="1"
      />
      {/* Head opening */}
      <ellipse cx="100" cy="72" rx="22" ry="10" fill={colorHex} stroke={stroke} strokeWidth="0.5" />

      {/* Style variations */}
      {design.collarKey === "butterfly" && (
        <path
          d="M38 100 Q20 120 15 160 L25 165 Q32 130 45 115 Z M162 100 Q180 120 185 160 L175 165 Q168 130 155 115 Z"
          fill={colorHex}
          stroke={stroke}
          strokeWidth="0.5"
        />
      )}
      {design.collarKey === "kimono" && (
        <path d="M55 75 L70 90 L100 88 L130 90 L145 75" fill="none" stroke={embroideryColor} strokeWidth="1.5" />
      )}
      {design.collarKey === "modern" && (
        <path d="M60 78 L75 95 L100 92 L125 95 L140 78" fill="none" stroke="#999" strokeWidth="1" />
      )}

      {/* Sleeves — abaya wide sleeves */}
      <path
        d="M38 140 Q15 150 10 200 L20 205 Q28 160 42 145 Z"
        fill={colorHex}
        stroke={stroke}
        strokeWidth="0.5"
      />
      <path
        d="M162 140 Q185 150 190 200 L180 205 Q172 160 158 145 Z"
        fill={colorHex}
        stroke={stroke}
        strokeWidth="0.5"
      />

      {/* Embroidery on chest / sleeves */}
      {hasEmbroidery && (
        <>
          <line x1="88" y1="110" x2="112" y2="110" stroke={embroideryColor} strokeWidth="2" />
          {design.embroideryKey === "traditional" && (
            <path d="M92 115 Q100 122 108 115" fill="none" stroke={embroideryColor} strokeWidth="1.5" />
          )}
          {design.embroideryKey === "gold" && (
            <>
              <circle cx="100" cy="118" r="4" fill="none" stroke={embroideryColor} strokeWidth="1" />
              <line x1="15" y1="195" x2="25" y2="195" stroke={embroideryColor} strokeWidth="1" />
              <line x1="175" y1="195" x2="185" y2="195" stroke={embroideryColor} strokeWidth="1" />
            </>
          )}
        </>
      )}
    </>
  );
}

function DishdashaSvg({
  design,
  colorHex,
  hasEmbroidery,
  embroideryColor,
}: {
  design: DesignConfig;
  colorHex: string;
  hasEmbroidery: boolean;
  embroideryColor: string;
}) {
  const stroke = colorHex === "#FFFFFF" || colorHex === "#F5F0E8" ? "#E5E0D8" : "rgba(0,0,0,0.1)";

  return (
    <>
      <path
        d="M60 80 L50 90 L45 120 L42 200 L40 300 L160 300 L158 200 L155 120 L150 90 L140 80 L130 75 L120 70 L100 68 L80 70 L70 75 Z"
        fill={colorHex}
        stroke={stroke}
        strokeWidth="1"
      />
      {design.collarKey === "classic" && (
        <path d="M75 70 L85 55 L100 50 L115 55 L125 70 L120 75 L100 72 L80 75 Z" fill={colorHex} stroke="#ddd" strokeWidth="0.5" />
      )}
      {design.collarKey === "omani" && (
        <>
          <path d="M70 72 L80 48 L100 44 L120 48 L130 72" fill="none" stroke={embroideryColor} strokeWidth="2" />
          <path d="M75 70 L85 52 L100 48 L115 52 L125 70" fill={colorHex} stroke="#ddd" strokeWidth="0.5" />
        </>
      )}
      {design.collarKey === "emirati" && (
        <path d="M72 70 L88 45 L100 42 L112 45 L128 70 L100 65 Z" fill={colorHex} stroke="#ccc" strokeWidth="0.5" />
      )}
      {design.collarKey === "modern" && (
        <path d="M78 70 L90 58 L100 55 L110 58 L122 70" fill="none" stroke="#999" strokeWidth="1.5" />
      )}
      <path d="M45 120 Q20 130 15 180 L25 185 Q30 140 50 130 Z" fill={colorHex} stroke={stroke} strokeWidth="0.5" />
      <path d="M155 120 Q180 130 185 180 L175 185 Q170 140 150 130 Z" fill={colorHex} stroke={stroke} strokeWidth="0.5" />
      <circle cx="22" cy="178" r="2" fill="#ddd" />
      <circle cx="178" cy="178" r="2" fill="#ddd" />
      {hasEmbroidery && (
        <>
          <line x1="85" y1="95" x2="115" y2="95" stroke={embroideryColor} strokeWidth="2" strokeDasharray={design.embroideryKey === "minimal" ? "4 2" : "0"} />
          {design.embroideryKey === "traditional" && (
            <>
              <path d="M90 100 Q100 108 110 100" fill="none" stroke={embroideryColor} strokeWidth="1.5" />
              <circle cx="100" cy="102" r="3" fill="none" stroke={embroideryColor} strokeWidth="1" />
            </>
          )}
          {design.embroideryKey === "gold" && (
            <path d="M92 98 L100 105 L108 98" fill="none" stroke={embroideryColor} strokeWidth="1.5" />
          )}
        </>
      )}
    </>
  );
}

export function GarmentPreview({ design, className, size = "md" }: GarmentPreviewProps) {
  const isAbaya = design.garmentType === "abaya";
  const colorHex = DESIGN_COLORS.find((c) => c.key === design.colorKey)?.hex ?? "#FFFFFF";
  const hasEmbroidery = design.embroideryKey !== "none";
  const embroideryColor =
    design.embroideryKey === "gold"
      ? "#C9A227"
      : design.embroideryKey === "silver"
        ? "#C0C0C0"
        : design.embroideryKey === "traditional"
          ? "#16825B"
          : "#888";

  const sizeClasses = {
    sm: isAbaya ? "h-52 w-36" : "h-48 w-32",
    md: isAbaya ? "h-80 w-48" : "h-72 w-44",
    lg: isAbaya ? "h-[26rem] w-60" : "h-96 w-56",
  };

  const garmentLabel = GARMENT_TYPES.find((g) => g.key === design.garmentType)?.ar ?? design.garmentType;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <motion.div
        key={`${design.garmentType}-${design.colorKey}-${design.collarKey}-${design.embroideryKey}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={cn("relative", sizeClasses[size])}
      >
        <div className="absolute bottom-0 inset-x-4 h-4 bg-black/10 rounded-full blur-md" />

        <svg viewBox="0 0 200 320" className="w-full h-full drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
          {isAbaya ? (
            <AbayaSvg design={design} colorHex={colorHex} hasEmbroidery={hasEmbroidery} embroideryColor={embroideryColor} />
          ) : (
            <DishdashaSvg design={design} colorHex={colorHex} hasEmbroidery={hasEmbroidery} embroideryColor={embroideryColor} />
          )}
        </svg>

        <div className="absolute top-2 start-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-navy shadow-sm">
          {garmentLabel}
        </div>
        <div className="absolute top-2 end-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-navy shadow-sm">
          {design.fabric}
        </div>
      </motion.div>
    </div>
  );
}

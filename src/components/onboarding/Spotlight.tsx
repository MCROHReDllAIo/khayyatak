"use client";

import { cn } from "@/lib/utils";

interface SpotlightProps {
  rect: DOMRect | null;
  padding?: number;
  className?: string;
}

export function Spotlight({ rect, padding = 10, className }: SpotlightProps) {
  if (!rect) {
    return <div className={cn("fixed inset-0 z-[90] bg-navy/75", className)} aria-hidden />;
  }

  const top = Math.max(8, rect.top - padding);
  const left = Math.max(8, rect.left - padding);
  const width = Math.min(typeof window !== "undefined" ? window.innerWidth - left - 8 : 400, rect.width + padding * 2);
  const height = Math.min(typeof window !== "undefined" ? window.innerHeight - top - 8 : 300, rect.height + padding * 2);

  return (
    <div className={cn("fixed inset-0 z-[90] pointer-events-none", className)} aria-hidden>
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={left}
              y={top}
              width={width}
              height={height}
              rx="16"
              fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(7,26,51,0.78)" mask="url(#tour-spotlight-mask)" />
      </svg>
      <div
        className="absolute rounded-2xl ring-2 ring-omani-gold/70 shadow-[0_0_28px_rgba(200,164,93,0.25)] motion-safe:animate-pulse"
        style={{ top, left, width, height }}
      />
    </div>
  );
}

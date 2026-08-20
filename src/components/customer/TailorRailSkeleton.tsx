"use client";

import { cn } from "@/lib/utils";

export function TailorRailSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] p-3 space-y-3 animate-pulse",
        className
      )}
      aria-hidden
    >
      <div className="flex gap-2">
        <div className="h-14 w-14 rounded-xl bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-3/4 rounded bg-white/10" />
          <div className="h-2.5 w-1/2 rounded bg-white/10" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="h-10 flex-1 rounded-lg bg-white/10" />
        <div className="h-10 flex-1 rounded-lg bg-white/10" />
        <div className="h-10 flex-1 rounded-lg bg-white/10" />
      </div>
      <div className="flex justify-between">
        <div className="h-3 w-16 rounded bg-white/10" />
        <div className="h-3 w-12 rounded bg-white/10" />
      </div>
      <div className="h-8 w-full rounded-lg bg-white/10" />
      <div className="flex gap-2">
        <div className="h-9 flex-1 rounded-lg bg-white/10" />
        <div className="h-9 flex-1 rounded-lg bg-white/10" />
      </div>
    </div>
  );
}

export function TailorRailSkeletonList({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TailorRailSkeleton key={i} />
      ))}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

export function SectionSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-white p-6 space-y-4 animate-pulse", className)}>
      <div className="h-6 w-48 bg-muted rounded-lg" />
      <div className="h-4 w-72 bg-muted/70 rounded" />
      <div className="grid gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function KPISkeleton() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-white p-5 animate-pulse">
          <div className="h-4 w-24 bg-muted rounded mb-3" />
          <div className="h-8 w-32 bg-muted rounded mb-2" />
          <div className="h-3 w-20 bg-muted/70 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-6 animate-pulse">
      <div className="h-6 w-40 bg-muted rounded mb-6" />
      <div className="h-64 bg-muted/40 rounded-xl" />
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
      <p className="text-navy font-medium">{message ?? "تعذر تحميل البيانات"}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary/90"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

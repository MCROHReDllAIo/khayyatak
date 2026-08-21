"use client";

import { useCallback, useEffect, useState } from "react";
import { AICenterHub } from "@/components/admin/AICenterHub";
import { SectionSkeleton, ErrorState } from "@/components/admin/AdminSkeleton";
import type { AIAnalyticsData, AIPerformanceData, ExecutiveInsight } from "@/lib/admin/types";
import type { SystemStatusPayload } from "@/lib/admin/system-status";

export default function AdminAICenterPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AIAnalyticsData | null>(null);
  const [performance, setPerformance] = useState<AIPerformanceData | null>(null);
  const [insights, setInsights] = useState<ExecutiveInsight[]>([]);
  const [system, setSystem] = useState<SystemStatusPayload | null>(null);

  const load = useCallback(async (soft?: boolean) => {
    if (soft) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [analyticsRes, statusRes] = await Promise.all([
        fetch("/api/admin/analytics?range=30d"),
        fetch("/api/admin/system-status"),
      ]);
      if (!analyticsRes.ok) throw new Error("Failed to load analytics");
      const a = await analyticsRes.json();
      setAnalytics(a.ai);
      setPerformance(a.aiPerf);
      setInsights(a.insights ?? []);
      if (statusRes.ok) {
        setSystem(await statusRes.json());
      } else {
        setSystem(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !analytics) {
    return (
      <div className="mx-auto max-w-5xl">
        <ErrorState onRetry={() => load()} message={error} />
      </div>
    );
  }

  if (loading || !analytics || !performance) {
    return <SectionSkeleton rows={10} className="min-h-[480px]" />;
  }

  return (
    <AICenterHub
      analytics={analytics}
      performance={performance}
      insights={insights}
      system={system}
      onRefresh={() => load(true)}
      refreshing={refreshing}
    />
  );
}

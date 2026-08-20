"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wand2, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/context/locale-context";
import type { CustomDesignRequest } from "@/lib/innovation/types";

const STATUS_ICON: Record<string, typeof Clock> = {
  SUBMITTED: Clock,
  IN_REVIEW: Clock,
  FEASIBLE: CheckCircle2,
  NEEDS_CHANGES: AlertTriangle,
  NOT_FEASIBLE: XCircle,
  ORDER_CREATED: CheckCircle2,
};

export default function TailorInnovationPage() {
  const { t } = useLocale();
  const [requests, setRequests] = useState<CustomDesignRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tailor/innovation")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          {t("طلبات الابتكار", "Innovation Requests")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("تصاميم مخصصة من العملاء — أنت تقرر إمكانية التنفيذ", "Custom designs — you decide feasibility")}
        </p>
      </div>

      {loading && <p className="text-muted-foreground text-sm">{t("جاري التحميل...", "Loading...")}</p>}

      {!loading && requests.length === 0 && (
        <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground">
          {t("لا توجد طلبات ابتكار حاليًا", "No innovation requests yet")}
        </div>
      )}

      <div className="space-y-3">
        {requests.map((req) => {
          const Icon = STATUS_ICON[req.status] ?? Clock;
          return (
            <Link
              key={req.id}
              href={`/tailor/innovation/${req.id}`}
              className="block rounded-xl border bg-white p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-navy">{req.customer_name ?? "عميل"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(req.created_at).toLocaleDateString("ar-OM")}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs font-medium">
                  <Icon className="h-3.5 w-3.5" />
                  {req.status}
                </span>
              </div>
              {req.ai_tailor_summary && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{req.ai_tailor_summary}</p>
              )}
              <Button size="sm" variant="outline" className="mt-3">
                {t("مراجعة الطلب", "Review request")}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

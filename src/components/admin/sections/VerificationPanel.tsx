"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, MessageSquare, Eye } from "lucide-react";
import { updateTailorVerification } from "@/lib/actions/auth";
import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

type Tab = "pending" | "verified" | "rejected" | "info_requested";

const TABS: { id: Tab; ar: string; en: string }[] = [
  { id: "pending", ar: "قيد المراجعة", en: "Pending" },
  { id: "verified", ar: "موثّق", en: "Verified" },
  { id: "rejected", ar: "مرفوض", en: "Rejected" },
  { id: "info_requested", ar: "تحتاج معلومات", en: "Info Needed" },
];

const STATUS_STYLE: Record<Tab, string> = {
  pending: "bg-amber-100 text-amber-800",
  verified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  info_requested: "bg-blue-100 text-blue-800",
};

interface VerificationRow {
  id: string;
  businessName: string;
  owner: string;
  city: string;
  services: string;
  documents: string;
  submittedDate: string;
  status: Tab;
}

export function VerificationPanel({ compact }: { compact?: boolean }) {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>("pending");
  const [list, setList] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verification");
      const json = await res.json();
      setList(json.list ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAction = async (tailorId: string, status: Tab) => {
    const result = await updateTailorVerification(tailorId, status);
    if (!result.error) refresh();
  };

  const filtered = list.filter((item) => item.status === tab);
  const display = compact ? filtered.slice(0, 4) : filtered;

  return (
    <section className="rounded-3xl border bg-white shadow-card p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-navy">{t("التحقق من الخياطين", "Tailor Verification")}</h2>
          {!compact && <p className="text-sm text-muted-foreground">{t("إدارة طلبات التحقق — بيانات حقيقية من قاعدة البيانات", "Manage verification — live database records")}</p>}
        </div>
        {compact && (
          <Link href="/admin/verification" className="text-sm text-primary hover:underline">
            {t("عرض الكل", "View all")} →
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium",
              tab === item.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            )}
          >
            {t(item.ar, item.en)} ({list.filter((l) => l.status === item.id).length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">{t("جاري التحميل...", "Loading...")}</p>
      ) : display.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{t("لا توجد سجلات في هذا القسم", "No records in this section")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="text-start py-3 pe-4">{t("الاسم", "Business")}</th>
                <th className="text-start py-3 pe-4 hidden md:table-cell">{t("المدينة", "City")}</th>
                <th className="text-start py-3 pe-4 hidden lg:table-cell">{t("الخدمات", "Services")}</th>
                <th className="text-start py-3 pe-4">{t("الحالة", "Status")}</th>
                <th className="text-end py-3">{t("إجراءات", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {display.map((row) => (
                <tr key={row.id} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="py-3 pe-4">
                    <p className="font-medium text-navy">{row.businessName}</p>
                    <p className="text-xs text-muted-foreground">{row.owner}</p>
                  </td>
                  <td className="py-3 pe-4 hidden md:table-cell">{row.city}</td>
                  <td className="py-3 pe-4 hidden lg:table-cell text-xs max-w-[180px] truncate">{row.services}</td>
                  <td className="py-3 pe-4">
                    <span className={cn("text-xs px-2 py-1 rounded-full", STATUS_STYLE[row.status])}>
                      {t(TABS.find((x) => x.id === row.status)?.ar ?? "", row.status)}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/tailors?id=${row.id}`} className="p-1.5 rounded-lg hover:bg-muted" title="View">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Link>
                      {row.status === "pending" && (
                        <>
                          <button type="button" onClick={() => handleAction(row.id, "verified")} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Approve">
                            <Check className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => handleAction(row.id, "rejected")} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Reject">
                            <X className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => handleAction(row.id, "info_requested")} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Request Info">
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

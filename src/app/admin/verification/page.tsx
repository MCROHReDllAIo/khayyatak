"use client";

import { VerificationPanel } from "@/components/admin/sections/VerificationPanel";
import { useLocale } from "@/lib/context/locale-context";

export default function AdminVerificationPage() {
  const { t } = useLocale();
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("إدارة التحقق", "Verification Management")}</h1>
        <p className="text-sm text-muted-foreground">{t("مراجعة وتوثيق طلبات الخياطين", "Review and verify tailor applications")}</p>
      </div>
      <VerificationPanel />
    </div>
  );
}

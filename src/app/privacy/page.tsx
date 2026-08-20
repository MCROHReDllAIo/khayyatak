"use client";

import Link from "next/link";
import { Shield, Trash2, Eye, Lock, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useLocale } from "@/lib/context/locale-context";
import { useState } from "react";

export default function PrivacyPage() {
  const { t } = useLocale();
  const [consent, setConsent] = useState({ ai: true, analytics: false, marketing: false });
  const [deleted, setDeleted] = useState<string | null>(null);

  const handleDelete = (type: string) => {
    setDeleted(type);
    setTimeout(() => setDeleted(null), 3000);
  };

  return (
    <div className="min-h-screen bg-omani-cream/30">
      <header className="sticky top-[29px] z-40 glass border-b px-4 h-14 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/"><Button variant="outline" size="sm">{t("الرئيسية", "Home")}</Button></Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-navy flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            {t("الخصوصية والذكاء المسؤول", "Privacy & Responsible AI")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t(
              "نحمي بياناتك وقياساتك وصورك. أنت تتحكم فيما يُحفظ وما يُحذف.",
              "We protect your data, measurements, and images. You control what is stored and deleted."
            )}
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold flex items-center gap-2"><FileCheck className="h-5 w-5 text-primary" />{t("الموافقات", "Consent")}</h2>
            {[
              { key: "ai" as const, ar: "معالجة AI للتصميم والقياسات", en: "AI processing for design & measurements" },
              { key: "analytics" as const, ar: "تحليلات مجمّعة (بدون بيانات شخصية)", en: "Aggregate analytics (no personal data)" },
              { key: "marketing" as const, ar: "عروض وإشعارات تسويقية", en: "Marketing offers & notifications" },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                <span className="text-sm">{t(item.ar, item.en)}</span>
                <input
                  type="checkbox"
                  checked={consent[item.key]}
                  onChange={(e) => setConsent((c) => ({ ...c, [item.key]: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />{t("ما نعالجه", "What we process")}</h2>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• {t("صور الإلهام — معالجة مؤقتة لتحليل التصميم", "Inspiration images — temporary processing for design analysis")}</li>
              <li>• {t("صور القياس — تقدير AI محلي، لا تُشارك علنًا", "Measurement photos — local AI estimate, never public")}</li>
              <li>• {t("المقاسات — خاصة بك وبالخياط المختار فقط", "Measurements — private to you and chosen tailor only")}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-bold flex items-center gap-2"><Trash2 className="h-5 w-5 text-destructive" />{t("حذف البيانات", "Data deletion")}</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { id: "images", ar: "حذف الصور", en: "Delete images" },
                { id: "measurements", ar: "حذف المقاسات", en: "Delete measurements" },
                { id: "account", ar: "حذف الحساب", en: "Delete account" },
              ].map((item) => (
                <Button key={item.id} variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                  {t(item.ar, item.en)}
                </Button>
              ))}
            </div>
            {deleted && (
              <p className="text-sm text-primary">{t(`تم طلب حذف ${deleted}`, `Deletion requested for ${deleted}`)}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">{t("أمان المنصة", "Platform security")}</p>
              <p className="text-muted-foreground mt-1">
                {t(
                  "RLS، أدوار المستخدمين، استدعاءات AI من الخادم، ومفاتيح API محمية. لا تُعرض مقاسات العملاء أو صورهم لأي مستخدم آخر.",
                  "RLS, user roles, server-side AI calls, and protected API keys. Customer measurements and photos are never shown to other users."
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

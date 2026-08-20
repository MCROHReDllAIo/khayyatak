"use client";

import { useAppState } from "@/lib/context/app-context";
import { useLocale } from "@/lib/context/locale-context";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminNotificationsPage() {
  const { t } = useLocale();
  const { notifications } = useAppState();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{t("الإشعارات", "Notifications")}</h1>
        <p className="text-sm text-muted-foreground">{t("إشعارات المنصة والعمليات", "Platform and operations notifications")}</p>
      </div>
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">{t("لا توجد إشعارات", "No notifications")}</CardContent></Card>
        ) : (
          notifications.map((n) => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <p className="font-medium text-navy">{t(n.title_ar, n.title_en)}</p>
                <p className="text-sm text-muted-foreground mt-1">{t(n.message_ar, n.message_en)}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

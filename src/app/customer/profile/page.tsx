"use client";

import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth, useAppState } from "@/lib/context/app-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { t, locale } = useLocale();
  const { user, logout } = useAuth();
  const { measurements, notifications, markNotificationRead } = useAppState();

  const myNotifications = notifications.filter((n) => n.user_id === user?.id);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-navy">{t("حسابي", "My Account")}</h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {user?.full_name_ar?.[0] ?? "ع"}
            </div>
            <div>
              <p className="font-bold text-lg">{user?.full_name_ar}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">{user?.city}</p>
            </div>
          </div>

          {measurements ? (
            <div className="rounded-xl bg-omani-cream p-4">
              <p className="text-sm font-medium">{t("المقاسات المحفوظة", "Saved Measurements")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("الطول", "Height")}: {measurements.height}cm • {t("الصدر", "Chest")}: {measurements.chest}cm
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              {t("احفظ مقاساتك لتسهيل طلباتك القادمة.", "Save measurements for easier future orders.")}
            </div>
          )}

          <div className="space-y-2">
            <Link href="/customer/measurements"><Button variant="outline" className="w-full">{t("تحديث المقاسات", "Update Measurements")}</Button></Link>
            <Link href="/login"><Button variant="ghost" className="w-full" onClick={logout}>{t("تبديل الحساب", "Switch Account")}</Button></Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-bold flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            {t("الإشعارات", "Notifications")}
            {myNotifications.filter((n) => !n.read).length > 0 && (
              <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                {myNotifications.filter((n) => !n.read).length}
              </span>
            )}
          </h2>
          {myNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("لا إشعارات بعد", "No notifications yet")}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {myNotifications.map((n) => (
                <div key={n.id} className={`rounded-lg p-3 text-sm border ${n.read ? "opacity-60" : "bg-primary/5"}`}>
                  <p className="font-medium">{locale === "ar" ? n.title_ar : n.title_en}</p>
                  <p className="text-muted-foreground text-xs mt-1">{locale === "ar" ? n.message_ar : n.message_en}</p>
                  {!n.read && (
                    <Button variant="ghost" size="sm" className="mt-2 h-7 gap-1" onClick={() => markNotificationRead(n.id)}>
                      <Check className="h-3 w-3" /> {t("قراءة", "Mark read")}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

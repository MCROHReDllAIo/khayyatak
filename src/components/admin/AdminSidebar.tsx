"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { BRAND } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, ADMIN_NAV_GROUPS, getAdminActiveHref } from "@/lib/admin/nav";

export function AdminSidebar({
  mobile,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { logout, user } = useAuth();
  const activeHref = getAdminActiveHref(pathname);
  const displayName = user?.full_name_ar || user?.full_name || t("مدير المنصة", "Platform Admin");
  const initial = displayName.trim()[0] ?? "م";

  return (
    <aside
      className={cn(
        "flex flex-col bg-gradient-to-b from-navy via-[#0f1729] to-[#0a1020] text-white h-full",
        mobile ? "w-full" : "w-64 shrink-0 hidden lg:flex"
      )}
    >
      <div className="p-5 border-b border-white/10">
        <Link href="/admin" className="block group" onClick={onNavigate}>
          <p className="text-lg font-bold tracking-tight font-arabic group-hover:text-omani-gold transition-colors">
            {t(BRAND.nameAr, BRAND.nameEn)}
          </p>
          <p className="text-sm text-omani-gold/90 font-arabic">{t(BRAND.taglineAr, BRAND.taglineEn)}</p>
          <p className="text-[10px] text-white/35 mt-2 uppercase tracking-[0.2em]">National Command</p>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {ADMIN_NAV_GROUPS.map((group) => {
          const items = ADMIN_NAV.filter((item) => item.group === group.id);
          return (
            <div key={group.id}>
              <p className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-white/35 font-medium">
                {t(group.ar, group.en)}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = activeHref === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                        active
                          ? "bg-primary text-white font-medium shadow-lg shadow-primary/25 ring-1 ring-white/10"
                          : "text-white/65 hover:bg-white/8 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", active && "text-white")} />
                      {t(item.ar, item.en)}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-omani-gold/30 to-primary/30 flex items-center justify-center text-omani-gold font-bold text-sm shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-emerald-400/90 flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("متصل", "Online")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-3 w-full flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-lg py-2.5 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t("تسجيل الخروج", "Logout")}
        </button>
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell, Sparkles, Menu, X } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { AdminSidebar } from "./AdminSidebar";

export function AdminTopBar() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const dateStr = new Date().toLocaleDateString(locale === "ar" ? "ar-OM" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <header className="sticky top-[29px] z-30 bg-white/95 backdrop-blur-md border-b border-border/40 px-4 md:px-6 h-16 flex items-center gap-4">
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg hover:bg-muted"
          onClick={() => setMobileNav(true)}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex-1 max-w-md relative hidden sm:block">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("ابحث عن خياط، طلب، عميل...", "Search tailor, order, customer...")}
            className="w-full h-10 ps-9 pe-4 rounded-xl border border-border/60 bg-omani-cream/30 text-sm outline-none focus:border-primary/40"
          />
        </div>

        <div className="flex items-center gap-2 ms-auto">
          <Link href="/admin/notifications" className="p-2 rounded-xl hover:bg-muted relative" aria-label="Notifications">
            <Bell className="h-5 w-5 text-navy" />
            <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-primary" />
          </Link>
          <Link href="/admin/ai-center" className="p-2 rounded-xl hover:bg-muted hidden sm:flex">
            <Sparkles className="h-5 w-5 text-primary" />
          </Link>
          <LanguageSwitcher />
          <div className="hidden md:block text-end ps-2 border-s border-border/40">
            <p className="text-xs text-muted-foreground">{dateStr}</p>
            <p className="text-sm font-medium text-navy truncate max-w-[120px]">{user?.full_name_ar}</p>
          </div>
        </div>
      </header>

      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNav(false)} />
          <div className="absolute top-0 end-0 h-full w-72 shadow-2xl">
            <button
              type="button"
              className="absolute top-4 start-4 z-10 p-2 text-white"
              onClick={() => setMobileNav(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <AdminSidebar mobile onNavigate={() => setMobileNav(false)} />
          </div>
        </div>
      )}
    </>
  );
}

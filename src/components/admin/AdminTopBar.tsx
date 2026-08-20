"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Sparkles, Menu, X } from "lucide-react";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { AdminSidebar } from "./AdminSidebar";
import { searchAdminNav } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

export function AdminTopBar() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const results = searchOpen ? searchAdminNav(search, locale) : [];

  const dateStr = new Date().toLocaleDateString(locale === "ar" ? "ar-OM" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const goTo = (href: string) => {
    setSearch("");
    setSearchOpen(false);
    router.push(href);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results[0]) goTo(results[0].href);
    if (e.key === "Escape") setSearchOpen(false);
  };

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

        <div className="flex-1 max-w-md relative hidden sm:block" ref={searchRef}>
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={onSearchKeyDown}
            placeholder={t("ابحث عن خياط، طلب، عميل...", "Search tailor, order, customer...")}
            className="w-full h-10 ps-9 pe-4 rounded-xl border border-border/60 bg-omani-cream/30 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
          {searchOpen && search.trim() && (
            <div className="absolute top-full mt-1 w-full rounded-xl border bg-white shadow-lg overflow-hidden z-50">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">{t("لا نتائج", "No results")}</p>
              ) : (
                results.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => goTo(item.href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-start hover:bg-omani-cream/40 transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-primary shrink-0" />
                    <span>{t(item.ar, item.en)}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ms-auto">
          <Link
            href="/admin/notifications"
            className="p-2 rounded-xl hover:bg-muted relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-navy" />
          </Link>
          <Link
            href="/admin/ai-center"
            className={cn(
              "p-2 rounded-xl hover:bg-muted hidden sm:flex",
              "text-primary bg-primary/5 ring-1 ring-primary/10"
            )}
            title={t("مركز الذكاء الاصطناعي", "AI Command Center")}
          >
            <Sparkles className="h-5 w-5" />
          </Link>
          <LanguageSwitcher />
          <div className="hidden md:block text-end ps-2 border-s border-border/40">
            <p className="text-xs text-muted-foreground">{dateStr}</p>
            <p className="text-sm font-medium text-navy truncate max-w-[140px]">
              {user?.full_name_ar ?? user?.full_name}
            </p>
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

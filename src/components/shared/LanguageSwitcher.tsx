"use client";

import { useLocale } from "@/lib/context/locale-context";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={cn("flex items-center gap-1 text-sm", className)}>
      <button
        onClick={() => setLocale("ar")}
        className={cn(
          "px-2 py-1 rounded-md transition-colors",
          locale === "ar" ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        العربية
      </button>
      <span className="text-muted-foreground">|</span>
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "px-2 py-1 rounded-md transition-colors",
          locale === "en" ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
        )}
      >
        English
      </button>
    </div>
  );
}

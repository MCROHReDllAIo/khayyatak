"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Locale } from "@/types";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (ar: string, en: string) => string;
  dir: "rtl" | "ltr";
  hydrated: boolean;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved === "ar" || saved === "en") {
      setLocaleState(saved);
    }
    setHydrated(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale, hydrated]);

  const t = useCallback(
    (ar: string, en: string) => (locale === "ar" ? ar : en),
    [locale]
  );

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t, dir: locale === "ar" ? "rtl" : "ltr", hydrated }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

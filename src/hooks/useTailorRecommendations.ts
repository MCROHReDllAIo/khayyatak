"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { City, DesignConfig, TailorMatch } from "@/types";
import type { FashionIntent } from "@/lib/ai/intent";
import type { StyleDNA } from "@/lib/ai/style-dna";
import { getBrowserSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

interface RecommendResponse {
  matches: TailorMatch[];
  cities: City[];
  context_title_ar: string;
  context_title_en: string;
  context_subtitle_ar: string;
  context_subtitle_en: string;
  error?: string;
}

export interface TailorRecommendationsState {
  matches: TailorMatch[];
  cities: City[];
  loading: boolean;
  contextTitleAr: string;
  contextTitleEn: string;
  contextSubtitleAr: string;
  contextSubtitleEn: string;
  refresh: () => void;
}

interface UseTailorRecommendationsOptions {
  cityId: string | null;
  design: DesignConfig;
  intent: FashionIntent | null;
  styleDNA: StyleDNA;
  favoriteTailorIds: string[];
  initialMatches?: TailorMatch[];
  initialCities?: City[];
  initialContextTitleAr?: string;
  initialContextTitleEn?: string;
}

export function useTailorRecommendations({
  cityId,
  design,
  intent,
  styleDNA,
  favoriteTailorIds,
  initialMatches = [],
  initialCities = [],
  initialContextTitleAr = "خياطوك",
  initialContextTitleEn = "Your tailors",
}: UseTailorRecommendationsOptions): TailorRecommendationsState {
  const [matches, setMatches] = useState<TailorMatch[]>(initialMatches);
  const [cities, setCities] = useState<City[]>(initialCities);
  const [loading, setLoading] = useState(initialMatches.length === 0);
  const [contextTitleAr, setContextTitleAr] = useState(initialContextTitleAr);
  const [contextTitleEn, setContextTitleEn] = useState(initialContextTitleEn);
  const [contextSubtitleAr, setContextSubtitleAr] = useState("خياطون مختارون لك بالذكاء الاصطناعي");
  const [contextSubtitleEn, setContextSubtitleEn] = useState("AI-curated tailors for you");

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRecommendations = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const res = await fetch("/api/customer/tailors/recommended", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city_id: cityId ?? undefined,
          design,
          intent: intent ?? undefined,
          style_dna: styleDNA,
          favorite_tailor_ids: favoriteTailorIds,
          limit: 6,
        }),
        signal: controller.signal,
      });

      const json = (await res.json()) as RecommendResponse;
      if (controller.signal.aborted) return;

      setMatches(json.matches ?? []);
      if (json.cities?.length) setCities(json.cities);
      if (json.context_title_ar) setContextTitleAr(json.context_title_ar);
      if (json.context_title_en) setContextTitleEn(json.context_title_en);
      if (json.context_subtitle_ar) setContextSubtitleAr(json.context_subtitle_ar);
      if (json.context_subtitle_en) setContextSubtitleEn(json.context_subtitle_en);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMatches([]);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [cityId, design, intent, styleDNA, favoriteTailorIds]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchRecommendations, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchRecommendations]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel("tailor-rail-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tailors" },
        () => fetchRecommendations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecommendations]);

  return {
    matches,
    cities,
    loading,
    contextTitleAr,
    contextTitleEn,
    contextSubtitleAr,
    contextSubtitleEn,
    refresh: fetchRecommendations,
  };
}

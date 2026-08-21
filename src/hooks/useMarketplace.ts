"use client";

import { useEffect, useState } from "react";
import type { Tailor, City } from "@/types";
import {
  SHOWCASE_CITIES,
  SHOWCASE_STORES,
} from "@/lib/showcase/demo-stores";

/**
 * Marketplace data with guaranteed demo stores when the live catalog is empty,
 * so the home never looks unfinished during pitches/demos.
 */
export function useMarketplaceData() {
  const [tailors, setTailors] = useState<Tailor[]>(SHOWCASE_STORES);
  const [cities, setCities] = useState<City[]>(SHOWCASE_CITIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showcase, setShowcase] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/public/marketplace")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const live = (json.tailors ?? []) as Tailor[];
        const liveCities = (json.cities ?? []) as City[];
        const useDemo = Boolean(json.showcase) || live.length === 0;

        if (useDemo) {
          setTailors(SHOWCASE_STORES);
          setCities(liveCities.length ? liveCities : SHOWCASE_CITIES);
          setShowcase(true);
        } else {
          setTailors(live);
          setCities(liveCities);
          setShowcase(false);
        }
        if (json.error) setError(json.error);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setTailors(SHOWCASE_STORES);
        setCities(SHOWCASE_CITIES);
        setShowcase(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { tailors, cities, loading, error, showcase };
}

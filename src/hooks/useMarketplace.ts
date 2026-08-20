"use client";

import { useEffect, useState } from "react";
import type { Tailor, City } from "@/types";

export function useMarketplaceData() {
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/marketplace")
      .then((r) => r.json())
      .then((json) => {
        setTailors(json.tailors ?? []);
        setCities(json.cities ?? []);
        if (json.error) setError(json.error);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { tailors, cities, loading, error };
}

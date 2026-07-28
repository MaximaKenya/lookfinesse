"use client";

import { useEffect, useState } from "react";

type IntelligenceMetrics = {
  treasuryLiquidity: number;
  fraudAlerts: number;
};

export function useIntelligenceMetrics() {
  const [metrics, setMetrics] =
    useState<IntelligenceMetrics | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const res = await fetch(
          "/api/intelligence/metrics"
        );

        if (!res.ok) {
          throw new Error(
            "Failed to load intelligence metrics"
          );
        }

        const data: IntelligenceMetrics =
          await res.json();

        setMetrics(data);

      } catch (error) {
        console.error(
          "Metrics load failed:",
          error
        );
      }
    };

    load();

    const interval = setInterval(() => {
      load();
    }, 5000);

    return () => clearInterval(interval);

  }, []);

  return metrics;
}
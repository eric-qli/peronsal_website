"use client";

import { useCallback, useEffect, useState } from "react";
import { ApplicationTable } from "@/components/jobfind/application-table";
import { SummaryStats } from "@/components/jobfind/summary-stats";
import { getApplications, JobFindApiError } from "@/lib/jobfind/api";
import {
  calculateApplicationStats,
  type ApplicationStats,
} from "@/lib/jobfind/types";

export function SummaryPageContent() {
  const [stats, setStats] = useState<ApplicationStats>(
    calculateApplicationStats([])
  );
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadStats = useCallback(async () => {
    setIsLoadingStats(true);
    setStatsError(null);

    try {
      const data = await getApplications();
      setStats(calculateApplicationStats(data));
    } catch (err) {
      setStatsError(
        err instanceof JobFindApiError
          ? err.message
          : "Failed to load application stats."
      );
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadStats();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadStats, refreshKey]);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Application Summary
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Track and manage your job applications in one place.
        </p>
      </header>

      {statsError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {statsError}
        </p>
      )}

      {isLoadingStats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl border border-border/60 bg-card/40"
            />
          ))}
        </div>
      ) : (
        <SummaryStats stats={stats} />
      )}

      <ApplicationTable
        refreshKey={refreshKey}
        onMutation={() => setRefreshKey((current) => current + 1)}
      />
    </div>
  );
}

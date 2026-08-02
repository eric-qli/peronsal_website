"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { ApplicationTable } from "@/components/jobfind/application-table";
import {
  getSummaryPanelId,
  getSummaryTabId,
  SummaryDashboardNav,
  type SummaryDashboardView,
} from "@/components/jobfind/summary-dashboard-nav";
import { SummaryStats } from "@/components/jobfind/summary-stats";
import { getApplications, JobFindApiError } from "@/lib/jobfind/api";
import {
  calculateApplicationStats,
  type ApplicationStats,
  type JobApplication,
} from "@/lib/jobfind/types";

function DashboardChartSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-border/60 bg-card/40 ${
        tall ? "h-[720px]" : "h-[420px]"
      }`}
    />
  );
}

const SummaryStatusView = dynamic(
  () =>
    import("@/components/jobfind/summary-status-view").then(
      (mod) => mod.SummaryStatusView
    ),
  { ssr: false, loading: () => <DashboardChartSkeleton /> }
);

const SummaryLocationView = dynamic(
  () =>
    import("@/components/jobfind/summary-location-view").then(
      (mod) => mod.SummaryLocationView
    ),
  { ssr: false, loading: () => <DashboardChartSkeleton /> }
);

const SummaryCompanyView = dynamic(
  () =>
    import("@/components/jobfind/summary-company-view").then(
      (mod) => mod.SummaryCompanyView
    ),
  { ssr: false, loading: () => <DashboardChartSkeleton tall /> }
);

export function SummaryPageContent() {
  const [activeView, setActiveView] = useState<SummaryDashboardView>("applications");
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<ApplicationStats>(
    calculateApplicationStats([])
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getApplications();
      setApplications(data);
      setStats(calculateApplicationStats(data));
    } catch (err) {
      setLoadError(
        err instanceof JobFindApiError
          ? err.message
          : "Failed to load application stats."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadDashboardData();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadDashboardData, refreshKey]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Application Summary
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Track and manage your job applications in one place.
        </p>
      </header>

      <SummaryDashboardNav activeView={activeView} onViewChange={setActiveView} />

      {loadError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      <div
        id={getSummaryPanelId(activeView)}
        role="tabpanel"
        aria-labelledby={getSummaryTabId(activeView)}
      >
        {activeView === "applications" ? (
          <div className="space-y-10">
            {isLoading ? (
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
        ) : null}

        {activeView === "status" ? (
          isLoading ? (
            <DashboardChartSkeleton />
          ) : (
            <SummaryStatusView applications={applications} />
          )
        ) : null}

        {activeView === "location" ? (
          isLoading ? (
            <DashboardChartSkeleton />
          ) : (
            <SummaryLocationView applications={applications} />
          )
        ) : null}

        {activeView === "company" ? (
          isLoading ? (
            <DashboardChartSkeleton tall />
          ) : (
            <SummaryCompanyView applications={applications} />
          )
        ) : null}
      </div>
    </div>
  );
}

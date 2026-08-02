"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const summaryDashboardViews = [
  "applications",
  "status",
  "location",
  "company",
] as const;

export type SummaryDashboardView = (typeof summaryDashboardViews)[number];

const viewLabels: Record<SummaryDashboardView, string> = {
  applications: "Applications",
  status: "Status",
  location: "Location",
  company: "Company",
};

interface SummaryDashboardNavProps {
  activeView: SummaryDashboardView;
  onViewChange: (view: SummaryDashboardView) => void;
}

export function SummaryDashboardNav({
  activeView,
  onViewChange,
}: SummaryDashboardNavProps) {
  const activeIndex = summaryDashboardViews.indexOf(activeView);

  function focusView(index: number) {
    const view = summaryDashboardViews[index];
    if (!view) return;
    onViewChange(view);
    document.getElementById(getSummaryTabId(view))?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusView((activeIndex + 1) % summaryDashboardViews.length);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusView(
        (activeIndex - 1 + summaryDashboardViews.length) %
          summaryDashboardViews.length
      );
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusView(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      focusView(summaryDashboardViews.length - 1);
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Summary dashboard views"
      className="-mx-1 overflow-x-auto px-1 pb-1"
      onKeyDown={handleKeyDown}
    >
      <div className="inline-flex min-w-full gap-1 rounded-xl border border-border/60 bg-card/50 p-1 sm:min-w-0">
        {summaryDashboardViews.map((view) => {
          const isActive = activeView === view;
          const tabId = `summary-tab-${view}`;
          const panelId = `summary-panel-${view}`;

          return (
            <button
              key={view}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onViewChange(view)}
              className={cn(
                "relative shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-5",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="summary-dashboard-tab-indicator"
                  className="absolute inset-0 rounded-lg bg-primary/15 ring-1 ring-primary/25"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              ) : null}
              <span className="relative z-10">{viewLabels[view]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function getSummaryTabId(view: SummaryDashboardView): string {
  return `summary-tab-${view}`;
}

export function getSummaryPanelId(view: SummaryDashboardView): string {
  return `summary-panel-${view}`;
}

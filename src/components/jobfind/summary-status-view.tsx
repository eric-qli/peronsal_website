"use client";

import { groupApplicationsByStatus } from "@/lib/jobfind/analytics";
import { SummaryChartPanel } from "@/components/jobfind/summary-chart-panel";
import { type JobApplication } from "@/lib/jobfind/types";

interface SummaryStatusViewProps {
  applications: JobApplication[];
}

export function SummaryStatusView({ applications }: SummaryStatusViewProps) {
  const data = groupApplicationsByStatus(applications);

  return (
    <SummaryChartPanel
      title="Applications by Status"
      description="Distribution of applications across current status values."
      data={data}
      total={applications.length}
      emptyMessage="No applications yet. Add one from the Input page."
    />
  );
}

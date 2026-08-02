"use client";

import { groupApplicationsByLocation } from "@/lib/jobfind/analytics";
import { SummaryChartPanel } from "@/components/jobfind/summary-chart-panel";
import { type JobApplication } from "@/lib/jobfind/types";

interface SummaryLocationViewProps {
  applications: JobApplication[];
}

export function SummaryLocationView({ applications }: SummaryLocationViewProps) {
  const data = groupApplicationsByLocation(applications);

  return (
    <SummaryChartPanel
      title="Applications by Location"
      description="Grouped by normalized location categories, with smaller groups combined into Other when needed."
      data={data}
      total={applications.length}
      emptyMessage="No applications yet. Add one from the Input page."
    />
  );
}

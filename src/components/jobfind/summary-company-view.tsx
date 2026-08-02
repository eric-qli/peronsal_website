"use client";

import {
  getChartColor,
  getCompanyRankings,
  groupApplicationsByCompany,
} from "@/lib/jobfind/analytics";
import { SummaryChartPanel } from "@/components/jobfind/summary-chart-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type JobApplication } from "@/lib/jobfind/types";

interface SummaryCompanyViewProps {
  applications: JobApplication[];
}

export function SummaryCompanyView({ applications }: SummaryCompanyViewProps) {
  const chartData = groupApplicationsByCompany(applications);
  const rankings = getCompanyRankings(applications);

  return (
    <div className="space-y-6">
      <SummaryChartPanel
        title="Applications by Company"
        description="Top companies by application count, with remaining companies grouped into Other."
        data={chartData}
        total={applications.length}
        emptyMessage="No applications yet. Add one from the Input page."
      />

      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Company Rankings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ranked list of companies by number of applications.
          </p>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No applications yet. Add one from the Input page.
            </p>
          ) : (
            <ol className="space-y-3">
              {rankings.map((company, index) => (
                <li
                  key={company.name}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/40 px-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-foreground"
                      style={{ backgroundColor: `${getChartColor(index)}33` }}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate font-medium text-foreground">
                      {company.name}
                    </span>
                  </div>
                  <div className="shrink-0 text-right text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {company.count}
                    </span>
                    <span className="ml-2">{company.percentage}%</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

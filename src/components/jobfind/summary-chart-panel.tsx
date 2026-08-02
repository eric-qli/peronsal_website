"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getChartColor, type ChartSegment } from "@/lib/jobfind/analytics";

interface SummaryChartPanelProps {
  title: string;
  description: string;
  data: ChartSegment[];
  total: number;
  emptyMessage?: string;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartSegment & { fill: string } }>;
}) {
  if (!active || !payload?.[0]) return null;

  const item = payload[0].payload;

  return (
    <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground">{item.name}</p>
      <p className="text-muted-foreground">
        {item.count} ({item.percentage}%)
      </p>
    </div>
  );
}

export function SummaryChartPanel({
  title,
  description,
  data,
  total,
  emptyMessage = "No application data available.",
}: SummaryChartPanelProps) {
  const chartData = data.map((segment, index) => ({
    ...segment,
    fill: getChartColor(index),
  }));

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-sm font-medium text-foreground">
          Total applications: {total}
        </p>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-center">
            <div className="mx-auto h-64 w-full max-w-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={2}
                    stroke="transparent"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {chartData.map((segment) => (
                <div
                  key={segment.name}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/40 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: segment.fill }}
                      aria-hidden
                    />
                    <span className="truncate text-sm font-medium text-foreground">
                      {segment.name}
                    </span>
                  </div>
                  <div className="shrink-0 text-right text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {segment.count}
                    </span>
                    <span className="ml-2">{segment.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

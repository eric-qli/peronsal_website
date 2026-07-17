"use client";

import {
  Briefcase,
  CalendarCheck,
  Handshake,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/jobfind/stat-card";
import { type ApplicationStats } from "@/lib/mock-jobfind-data";

interface SummaryStatsProps {
  stats: ApplicationStats;
}

export function SummaryStats({ stats }: SummaryStatsProps) {
  const items = [
    {
      label: "Applications",
      value: stats.applications,
      icon: Briefcase,
      accent: "default" as const,
    },
    {
      label: "Interviews",
      value: stats.interviews,
      icon: CalendarCheck,
      accent: "success" as const,
    },
    {
      label: "Offers",
      value: stats.offers,
      icon: Handshake,
      accent: "success" as const,
    },
    {
      label: "Rejections",
      value: stats.rejections,
      icon: XCircle,
      accent: "danger" as const,
    },
    {
      label: "Response Rate",
      value: `${stats.responseRate}%`,
      icon: TrendingUp,
      accent: "warning" as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item, index) => (
        <StatCard key={item.label} {...item} index={index} />
      ))}
    </div>
  );
}

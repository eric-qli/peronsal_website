"use client";

import {
  Briefcase,
  CalendarCheck,
  ClipboardList,
  Handshake,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/jobfind/stat-card";
import { type ApplicationStats } from "@/lib/jobfind/types";

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
      label: "OA",
      value: stats.oa,
      icon: ClipboardList,
      accent: "warning" as const,
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
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item, index) => (
        <StatCard key={item.label} {...item} index={index} />
      ))}
    </div>
  );
}

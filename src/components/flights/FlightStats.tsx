"use client";

import { Globe2, MapPin, Plane, Route } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceKm } from "@/lib/flights/distance";
import { type FlightStats as FlightStatsData } from "@/lib/flights/types";
import { cn } from "@/lib/utils";

interface FlightStatsProps {
  stats: FlightStatsData;
  className?: string;
}

const statItems = [
  {
    key: "totalFlights",
    label: "Total flights",
    icon: Plane,
    format: (stats: FlightStatsData) => stats.totalFlights.toLocaleString(),
  },
  {
    key: "totalDistanceKm",
    label: "Distance traveled",
    icon: Route,
    format: (stats: FlightStatsData) => formatDistanceKm(stats.totalDistanceKm),
  },
  {
    key: "uniqueAirports",
    label: "Airports visited",
    icon: MapPin,
    format: (stats: FlightStatsData) => stats.uniqueAirports.toLocaleString(),
  },
  {
    key: "uniqueCountries",
    label: "Countries visited",
    icon: Globe2,
    format: (stats: FlightStatsData) => stats.uniqueCountries.toLocaleString(),
  },
] as const;

export function FlightStats({ stats, className }: FlightStatsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2 md:gap-2.5",
        className
      )}
    >
      {statItems.map(({ key, label, icon: Icon, format }) => (
        <Card
          key={key}
          className="border-[#303846]/80 bg-[#0E1219]/90 text-foreground backdrop-blur-md"
        >
          <CardContent className="flex items-center gap-3 px-3 py-3 md:px-4 md:py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
              <Icon className="size-4 text-[#D7DEE8]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#94A3B8] md:text-xs">
                {label}
              </p>
              <p className="truncate text-lg font-semibold tracking-tight md:text-xl">
                {format(stats)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

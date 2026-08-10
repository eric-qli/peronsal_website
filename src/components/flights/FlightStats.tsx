"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { FlightStatsDetailPanel } from "@/components/flights/FlightStatsDetailPanel";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/data";
import { type StatPanel } from "@/lib/flights/stat-details";
import { type Flight, type FlightStats as FlightStatsData } from "@/lib/flights/types";
import { cn } from "@/lib/utils";

interface FlightStatsProps {
  stats: FlightStatsData;
  flights: Flight[];
  className?: string;
  onAddFlight?: () => void;
}

function StatBlock({
  value,
  label,
  unit,
  active,
  onClick,
}: {
  value: string;
  label: string;
  unit?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-w-[4.5rem] cursor-pointer flex-col items-center rounded-xl px-3 py-1.5 transition-colors duration-200 sm:min-w-[5.5rem] sm:px-4",
        "border border-transparent hover:border-teal-400/20 hover:bg-teal-400/[0.06]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/30",
        active && "border-teal-400/25 bg-teal-400/[0.08]"
      )}
    >
      <p
        className={cn(
          "text-xl font-semibold tracking-tight tabular-nums transition-colors duration-200 sm:text-2xl",
          active ? "text-white" : "text-[#f0fdfa] group-hover:text-white"
        )}
      >
        {value}
        {unit ? (
          <span className="ml-0.5 text-sm font-normal text-[#99f6e4]/80 sm:text-base">
            {unit}
          </span>
        ) : null}
      </p>
      <p
        className={cn(
          "mt-1 text-[11px] transition-colors duration-200 sm:text-xs",
          active ? "text-[#ccfbf1]" : "text-[#94a3b8]"
        )}
      >
        {label}
      </p>
    </button>
  );
}

export function FlightStats({
  stats,
  flights,
  className,
  onAddFlight,
}: FlightStatsProps) {
  const [activePanel, setActivePanel] = useState<StatPanel | null>(null);

  const initials = siteConfig.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const togglePanel = useCallback((panel: StatPanel) => {
    setActivePanel((current) => (current === panel ? null : panel));
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  return (
    <div
      data-flight-stats-root
      className={cn("flex flex-col items-stretch", className)}
    >
      {activePanel ? (
        <div className="mb-3 px-3 sm:px-4">
          <FlightStatsDetailPanel
            panel={activePanel}
            flights={flights}
            totalDistanceKm={stats.totalDistanceKm}
            onClose={closePanel}
          />
        </div>
      ) : null}

      <div className="rounded-t-[1.35rem] border border-white/[0.08] border-b-0 bg-[#0a1014]/92 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/30 to-cyan-500/20 ring-1 ring-teal-300/25">
              <span className="text-sm font-semibold text-[#ccfbf1]">
                {initials}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#f8fafc] sm:text-base">
                {siteConfig.name}
              </p>
              <p className="truncate text-xs text-[#64748b]">Flight history</p>
            </div>
          </div>

          {onAddFlight ? (
            <Button
              size="sm"
              onClick={onAddFlight}
              className="hidden h-8 shrink-0 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 text-xs text-[#ccfbf1] hover:bg-teal-400/20 sm:inline-flex sm:h-9 sm:px-4 sm:text-sm"
            >
              <Plus className="size-3.5 sm:size-4" />
              Add flight
            </Button>
          ) : null}
        </div>

        <div className="flex items-center justify-around overflow-x-auto px-2 py-3.5 sm:px-4 sm:py-4">
          <StatBlock
            value={Math.round(stats.totalDistanceKm).toLocaleString()}
            unit="km"
            label="Distance"
            active={activePanel === "distance"}
            onClick={() => togglePanel("distance")}
          />
          <div className="h-10 w-px shrink-0 bg-white/[0.08]" />
          <StatBlock
            value={stats.totalFlights.toLocaleString()}
            label="Flights"
            active={activePanel === "flights"}
            onClick={() => togglePanel("flights")}
          />
          <div className="h-10 w-px shrink-0 bg-white/[0.08]" />
          <StatBlock
            value={stats.uniqueCountries.toLocaleString()}
            label="Countries"
            active={activePanel === "countries"}
            onClick={() => togglePanel("countries")}
          />
          <div className="h-10 w-px shrink-0 bg-white/[0.08]" />
          <StatBlock
            value={stats.uniqueCities.toLocaleString()}
            label="Cities"
            active={activePanel === "cities"}
            onClick={() => togglePanel("cities")}
          />
        </div>
      </div>
    </div>
  );
}

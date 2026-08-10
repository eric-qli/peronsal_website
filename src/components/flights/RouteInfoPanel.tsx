"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceKm } from "@/lib/flights/distance";
import { type AggregatedRoute } from "@/lib/flights/route-groups";
import { formatFlightDate } from "@/lib/flights/utils";
import { cn } from "@/lib/utils";

interface RouteInfoPanelProps {
  route: AggregatedRoute | null;
  open: boolean;
  onClose: () => void;
  onSelectFlight?: (flightId: string) => void;
}

export function RouteInfoPanel({
  route,
  open,
  onClose,
  onSelectFlight,
}: RouteInfoPanelProps) {
  if (!open || !route) return null;

  return (
    <aside
      className={cn(
        "pointer-events-auto absolute bottom-[9.5rem] right-3 z-40 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1014]/94 shadow-2xl backdrop-blur-xl sm:bottom-40 md:right-5"
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div>
          <p className="text-lg font-semibold tracking-tight text-[#f0fdfa]">
            {route.airportA} ↔ {route.airportB}
          </p>
          <p className="mt-1 text-xs text-[#94a3b8]">
            {[route.cityA, route.cityB].filter(Boolean).join(" · ") ||
              "Route history"}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 text-[#94a3b8] hover:bg-white/5 hover:text-white"
          onClick={onClose}
          aria-label="Close route details"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 py-3 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#64748b]">
            Flights
          </p>
          <p className="mt-1 font-semibold text-[#f8fafc]">
            {route.flightCount}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#64748b]">
            Distance
          </p>
          <p className="mt-1 font-semibold text-[#f8fafc]">
            {formatDistanceKm(route.totalDistanceKm)}
          </p>
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto border-t border-white/[0.06] px-2 py-2">
        <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.14em] text-[#64748b]">
          Flight history
        </p>
        <ul className="space-y-1">
          {route.flights.map((flight) => {
            const label = [flight.airline, flight.flightNumber]
              .filter(Boolean)
              .join(" ");

            return (
              <li key={flight.id}>
                <button
                  type="button"
                  onClick={() => onSelectFlight?.(flight.id)}
                  className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <p className="text-sm font-medium text-[#e2e8f0]">
                    {label || "Flight"}
                  </p>
                  <p className="mt-0.5 text-xs text-[#94a3b8]">
                    {formatFlightDate(flight.departureDate)}
                  </p>
                  <p className="mt-0.5 text-xs text-teal-200/80">
                    {flight.departureIata} → {flight.arrivalIata}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

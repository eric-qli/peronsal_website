"use client";

import { useEffect, useMemo, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceKm } from "@/lib/flights/distance";
import {
  getCityStats,
  getCountryStats,
  getFlightsByDate,
  getFlightsByDistance,
  type StatPanel,
} from "@/lib/flights/stat-details";
import { type Flight } from "@/lib/flights/types";
import { formatFlightDate } from "@/lib/flights/utils";
import { cn } from "@/lib/utils";

interface FlightStatsDetailPanelProps {
  panel: StatPanel;
  flights: Flight[];
  totalDistanceKm: number;
  onClose: () => void;
}

const PANEL_META: Record<
  StatPanel,
  { title: string; subtitle: (ctx: PanelContext) => string }
> = {
  distance: {
    title: "Distance",
    subtitle: ({ totalDistanceKm, flightCount }) =>
      `${Math.round(totalDistanceKm).toLocaleString()} km total · ${flightCount} ${
        flightCount === 1 ? "flight" : "flights"
      }`,
  },
  flights: {
    title: "Flights",
    subtitle: ({ flightCount }) =>
      `${flightCount} total ${flightCount === 1 ? "flight" : "flights"}`,
  },
  countries: {
    title: "Countries",
    subtitle: ({ countryCount }) =>
      `${countryCount} ${countryCount === 1 ? "country" : "countries"} visited`,
  },
  cities: {
    title: "Cities",
    subtitle: ({ cityCount }) =>
      `${cityCount} ${cityCount === 1 ? "city" : "cities"} visited`,
  },
};

interface PanelContext {
  flightCount: number;
  totalDistanceKm: number;
  countryCount: number;
  cityCount: number;
}

function flightLabel(flight: Flight): string {
  return [flight.airline, flight.flightNumber].filter(Boolean).join(" ");
}

function cityPair(flight: Flight): string {
  const from = flight.departureCity || flight.departureIata;
  const to = flight.arrivalCity || flight.arrivalIata;
  return `${from} → ${to}`;
}

function DistanceDetails({ flights }: { flights: Flight[] }) {
  const rows = useMemo(() => getFlightsByDistance(flights), [flights]);

  if (!rows.length) {
    return <EmptyState message="No flights to rank by distance." />;
  }

  return (
    <ul className="divide-y divide-white/[0.06]">
      {rows.map(({ flight, distanceKm, rank }) => (
        <li key={flight.id} className="flex items-start gap-3 px-1 py-3.5">
          <RankBadge rank={rank} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#f0fdfa]">
                  {flight.departureIata} → {flight.arrivalIata}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#94a3b8]">
                  {cityPair(flight)}
                </p>
                <p className="mt-1 truncate text-xs text-[#64748b]">
                  {[flightLabel(flight) || null, formatFlightDate(flight.departureDate)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {rank === 1 ? (
                  <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-teal-300/80">
                    Longest flight
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-cyan-200">
                {formatDistanceKm(distanceKm)}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function FlightHistoryDetails({ flights }: { flights: Flight[] }) {
  const rows = useMemo(() => getFlightsByDate(flights), [flights]);

  if (!rows.length) {
    return <EmptyState message="No flights recorded yet." />;
  }

  return (
    <ul className="divide-y divide-white/[0.06]">
      {rows.map(({ flight, distanceKm }) => (
        <li key={flight.id} className="px-1 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#f0fdfa]">
                {formatFlightDate(flight.departureDate)}
              </p>
              <p className="mt-1 truncate text-sm text-[#e2e8f0]">
                {flightLabel(flight) || "Flight"}
              </p>
              <p className="mt-0.5 truncate text-xs text-[#94a3b8]">
                {flight.departureIata} → {flight.arrivalIata}
              </p>
              <p className="mt-0.5 truncate text-xs text-[#64748b]">
                {cityPair(flight)}
              </p>
            </div>
            <p className="shrink-0 text-sm tabular-nums text-cyan-200/90">
              {formatDistanceKm(distanceKm)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CountryDetails({ flights }: { flights: Flight[] }) {
  const rows = useMemo(() => getCountryStats(flights), [flights]);

  if (!rows.length) {
    return <EmptyState message="No countries recorded yet." />;
  }

  return (
    <ul className="divide-y divide-white/[0.06]">
      {rows.map((row) => (
        <li
          key={row.key}
          className="flex items-center justify-between gap-4 px-1 py-3.5"
        >
          <p className="min-w-0 truncate text-sm font-medium text-[#f0fdfa]">
            {row.countryName}
          </p>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums text-cyan-200">
              {row.internationalArrivals}
            </p>
            <p className="mt-0.5 text-[11px] text-[#64748b]">
              international{" "}
              {row.internationalArrivals === 1 ? "arrival" : "arrivals"}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CityDetails({ flights }: { flights: Flight[] }) {
  const rows = useMemo(() => getCityStats(flights), [flights]);

  if (!rows.length) {
    return <EmptyState message="No cities recorded yet." />;
  }

  return (
    <ul className="divide-y divide-white/[0.06]">
      {rows.map((row) => (
        <li key={row.key} className="flex items-start gap-3 px-1 py-3.5">
          <RankBadge rank={row.rank} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="truncate text-sm font-medium text-[#f0fdfa]">
                {row.cityName}
                {row.countryName ? (
                  <span className="font-normal text-[#94a3b8]">
                    , {row.countryName}
                  </span>
                ) : null}
              </p>
              <p className="shrink-0 text-sm tabular-nums text-cyan-200">
                {row.visitCount}{" "}
                {row.visitCount === 1 ? "visit" : "visits"}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[11px] font-medium tabular-nums text-[#94a3b8]">
      #{rank}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="px-1 py-8 text-center text-sm text-[#64748b]">{message}</p>
  );
}

export function FlightStatsDetailPanel({
  panel,
  flights,
  totalDistanceKm,
  onClose,
}: FlightStatsDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const countries = useMemo(() => getCountryStats(flights), [flights]);
  const cities = useMemo(() => getCityStats(flights), [flights]);

  const context: PanelContext = {
    flightCount: flights.length,
    totalDistanceKm,
    countryCount: countries.length,
    cityCount: cities.length,
  };

  const meta = PANEL_META[panel];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;

      const statsRoot = document.querySelector("[data-flight-stats-root]");
      if (statsRoot?.contains(target)) return;

      onClose();
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="flight-stats-detail-title"
      className={cn(
        "pointer-events-auto mx-auto w-full max-w-[44rem] overflow-hidden rounded-2xl",
        "border border-teal-400/20 bg-[#0a1014]/94 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      )}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2
            id="flight-stats-detail-title"
            className="text-lg font-semibold tracking-tight text-[#f0fdfa]"
          >
            {meta.title}
          </h2>
          <p className="mt-1 text-xs text-[#94a3b8] sm:text-sm">
            {meta.subtitle(context)}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 text-[#94a3b8] hover:bg-white/5 hover:text-white"
          onClick={onClose}
          aria-label="Close details"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="max-h-[min(52vh,28rem)] overflow-y-auto px-3 py-1 sm:px-4">
        {panel === "distance" ? <DistanceDetails flights={flights} /> : null}
        {panel === "flights" ? <FlightHistoryDetails flights={flights} /> : null}
        {panel === "countries" ? <CountryDetails flights={flights} /> : null}
        {panel === "cities" ? <CityDetails flights={flights} /> : null}
      </div>
    </div>
  );
}

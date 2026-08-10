"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plane, Plus } from "lucide-react";
import { AddFlightForm } from "@/components/flights/AddFlightForm";
import { FlightDetailsPanel } from "@/components/flights/FlightDetailsPanel";
import { FlightStats } from "@/components/flights/FlightStats";
import { RouteInfoPanel } from "@/components/flights/RouteInfoPanel";
import { Button } from "@/components/ui/button";
import { deleteFlight, FlightsApiError } from "@/lib/flights/api";
import { MAP_STATS_CARD_INSET_PX, MAP_THEME } from "@/lib/flights/map-style";
import {
  getRouteKeyForFlight,
  groupFlightsByRoute,
  type FlightVisualizationMode,
} from "@/lib/flights/route-groups";
import { type Flight } from "@/lib/flights/types";
import { computeFlightStats } from "@/lib/flights/utils";
import { cn } from "@/lib/utils";

const FlightMap = dynamic(() => import("@/components/flights/FlightMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ backgroundColor: MAP_THEME.background }}
    >
      <Loader2 className="size-6 animate-spin text-teal-200/60" />
    </div>
  ),
});

export function FlightsPageContent({
  initialFlights,
}: {
  initialFlights: Flight[];
}) {
  const [flights, setFlights] = useState<Flight[]>(initialFlights);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [selectedRouteKey, setSelectedRouteKey] = useState<string | null>(null);
  const [visualizationMode, setVisualizationMode] =
    useState<FlightVisualizationMode>("routes");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const stats = useMemo(() => computeFlightStats(flights), [flights]);
  const selectedRoute = useMemo(() => {
    if (!selectedRouteKey) return null;
    return (
      groupFlightsByRoute(flights).find((route) => route.key === selectedRouteKey) ??
      null
    );
  }, [flights, selectedRouteKey]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  function openAddFlight() {
    setEditingFlight(null);
    setIsAddOpen(true);
  }

  function handleFlightSaved(flight: Flight) {
    setFlights((current) => {
      const existingIndex = current.findIndex((item) => item.id === flight.id);
      if (existingIndex === -1) {
        return [flight, ...current];
      }

      const next = [...current];
      next[existingIndex] = flight;
      return next;
    });
    setSelectedFlight(flight);
    setSelectedRouteKey(getRouteKeyForFlight(flight));
    setEditingFlight(null);
    setSuccessMessage(
      editingFlight ? "Flight updated successfully." : "Flight added successfully."
    );
  }

  function handleSelectFlight(flight: Flight) {
    setSelectedFlight(flight);
    setSelectedRouteKey(null);
    setIsAddOpen(false);
    setEditingFlight(null);
  }

  function handleSelectRoute(routeKey: string) {
    setSelectedRouteKey(routeKey);
    setSelectedFlight(null);
    setIsAddOpen(false);
    setEditingFlight(null);
  }

  function handleEditFlight(flight: Flight) {
    setEditingFlight(flight);
    setIsAddOpen(true);
    setSelectedFlight(null);
  }

  async function handleDeleteFlight(flight: Flight) {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteFlight(flight.id);
      setFlights((current) => current.filter((item) => item.id !== flight.id));
      setSelectedFlight(null);
      setSuccessMessage("Flight deleted.");
    } catch (deleteError) {
      if (deleteError instanceof FlightsApiError) {
        setError(deleteError.message);
      } else {
        setError("Failed to delete flight.");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      className="relative h-[calc(100dvh-5.5rem)] min-h-[560px] overflow-hidden md:h-[calc(100dvh-6rem)]"
      style={{ backgroundColor: MAP_THEME.background }}
    >
      <div className="absolute inset-0 z-0">
        <FlightMap
          flights={flights}
          mode={visualizationMode}
          selectedRouteKey={selectedRouteKey}
          selectedFlightId={selectedFlight?.id ?? null}
          onSelectRoute={handleSelectRoute}
          onSelectFlight={handleSelectFlight}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44"
        style={{
          background: `linear-gradient(to top, ${MAP_THEME.vignette}, transparent)`,
        }}
      />

      <div className="pointer-events-none absolute left-3 top-3 z-30 md:left-5 md:top-5">
        <div className="pointer-events-auto inline-flex rounded-full border border-white/10 bg-[#0a1014]/80 p-1 shadow-lg backdrop-blur-md">
          {(
            [
              ["routes", "Routes"],
              ["individual", "Individual Flights"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setVisualizationMode(mode);
                if (mode === "routes") {
                  setSelectedFlight(null);
                } else {
                  setSelectedRouteKey(null);
                }
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
                visualizationMode === mode
                  ? "bg-teal-400/20 text-[#ccfbf1]"
                  : "text-[#94a3b8] hover:text-[#e2e8f0]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-30 md:right-5 md:top-5">
        <div className="pointer-events-auto">
          <Button
            onClick={openAddFlight}
            size="icon"
            className="size-10 rounded-full border border-white/10 bg-[#0a1014]/75 text-[#ccfbf1] shadow-lg backdrop-blur-md hover:bg-[#0f161b]/90 md:hidden"
            aria-label="Add flight"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {!flights.length ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-center px-6 pb-[148px] pt-16">
          <div className="pointer-events-auto max-w-md rounded-2xl border border-teal-400/15 bg-[#0a1014]/90 px-6 py-8 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-teal-400/10 ring-1 ring-teal-300/20">
              <Plane className="size-5 text-teal-200" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-[#f0fdfa]">
              No flights recorded yet
            </h2>
            <p className="mt-2 text-sm text-[#94a3b8]">
              Add your first route to start building your personal flight map.
            </p>
            <Button
              className="mt-5 rounded-full border border-teal-400/20 bg-teal-400/15 text-[#ccfbf1] hover:bg-teal-400/25"
              onClick={openAddFlight}
            >
              Add your first flight
            </Button>
          </div>
        </div>
      ) : null}

      <RouteInfoPanel
        route={selectedRoute}
        open={visualizationMode === "routes" && Boolean(selectedRoute)}
        onClose={() => setSelectedRouteKey(null)}
        onSelectFlight={(flightId) => {
          const flight = flights.find((item) => item.id === flightId);
          if (flight) {
            handleSelectFlight(flight);
          }
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
        <FlightStats
          stats={stats}
          flights={flights}
          onAddFlight={openAddFlight}
          className="pointer-events-auto"
        />
      </div>

      {error ? (
        <div
          className="pointer-events-none absolute left-1/2 z-40 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border border-red-400/25 bg-red-950/80 px-4 py-3 text-sm text-red-200 backdrop-blur-md"
          style={{ bottom: MAP_STATS_CARD_INSET_PX + 16 }}
        >
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div
          className="pointer-events-none absolute left-1/2 z-40 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border border-teal-400/20 bg-teal-950/70 px-4 py-3 text-sm text-teal-100 backdrop-blur-md"
          style={{ bottom: MAP_STATS_CARD_INSET_PX + 16 }}
        >
          {successMessage}
        </div>
      ) : null}

      <AddFlightForm
        open={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingFlight(null);
        }}
        onSuccess={handleFlightSaved}
        editingFlight={editingFlight}
        onViewExistingFlight={(flight) => {
          setSelectedFlight(flight);
          setSelectedRouteKey(null);
          setIsAddOpen(false);
          setEditingFlight(null);
        }}
      />

      <FlightDetailsPanel
        flight={selectedFlight}
        open={Boolean(selectedFlight)}
        onClose={() => setSelectedFlight(null)}
        onEdit={handleEditFlight}
        onDelete={handleDeleteFlight}
        isDeleting={isDeleting}
      />
    </div>
  );
}

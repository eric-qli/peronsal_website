"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plane, Plus } from "lucide-react";
import { AddFlightForm } from "@/components/flights/AddFlightForm";
import { FlightDetailsPanel } from "@/components/flights/FlightDetailsPanel";
import { FlightStats } from "@/components/flights/FlightStats";
import { Button } from "@/components/ui/button";
import { deleteFlight, FlightsApiError } from "@/lib/flights/api";
import { type Flight } from "@/lib/flights/types";
import { computeFlightStats } from "@/lib/flights/utils";

const FlightMap = dynamic(() => import("@/components/flights/FlightMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#080B10]">
      <Loader2 className="size-6 animate-spin text-[#94A3B8]" />
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const stats = useMemo(() => computeFlightStats(flights), [flights]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

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
    setEditingFlight(null);
    setSuccessMessage(
      editingFlight ? "Flight updated successfully." : "Flight added successfully."
    );
  }

  function handleSelectFlight(flight: Flight) {
    setSelectedFlight(flight);
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
    <div className="relative h-[calc(100dvh-5.5rem)] min-h-[560px] overflow-hidden md:h-[calc(100dvh-6rem)]">
      <div className="absolute inset-0 z-0">
        <FlightMap
          flights={flights}
          selectedFlightId={selectedFlight?.id ?? null}
          onSelectFlight={handleSelectFlight}
        />
      </div>

      <aside className="pointer-events-none absolute left-0 top-0 z-30 p-3 md:p-5">
        <div className="pointer-events-auto w-[11.75rem] sm:w-52">
          <FlightStats stats={stats} />
        </div>
      </aside>

      <div className="pointer-events-none absolute right-0 top-0 z-30 p-3 md:p-5">
        <div className="pointer-events-auto">
          <Button
            onClick={() => {
              setEditingFlight(null);
              setIsAddOpen(true);
            }}
            className="bg-[#E8EDF5] text-[#080B10] hover:bg-white"
          >
            <Plus className="size-4" />
            Add Flight
          </Button>
        </div>
      </div>

      {!flights.length ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6">
          <div className="pointer-events-auto max-w-md rounded-2xl border border-[#303846]/80 bg-[#0E1219]/85 px-6 py-8 text-center backdrop-blur-md">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
              <Plane className="size-5 text-[#D7DEE8]" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight">
              No flights recorded yet
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your first route to start building your personal world flight
              map.
            </p>
            <Button
              className="mt-5 bg-[#E8EDF5] text-[#080B10] hover:bg-white"
              onClick={() => {
                setEditingFlight(null);
                setIsAddOpen(true);
              }}
            >
              Add your first flight
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-30 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive backdrop-blur-md">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-30 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200 backdrop-blur-md">
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

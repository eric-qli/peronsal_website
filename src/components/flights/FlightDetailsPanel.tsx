"use client";

import { useEffect } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistanceKm } from "@/lib/flights/distance";
import { type Flight } from "@/lib/flights/types";
import { formatFlightDate } from "@/lib/flights/utils";
import { cn } from "@/lib/utils";

interface FlightDetailsPanelProps {
  flight: Flight | null;
  open: boolean;
  onClose: () => void;
  onEdit: (flight: Flight) => void;
  onDelete: (flight: Flight) => void;
  isDeleting?: boolean;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-[0.14em] text-[#94A3B8]">
        {label}
      </p>
      <p className="text-sm text-foreground">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

export function FlightDetailsPanel({
  flight,
  open,
  onClose,
  onEdit,
  onDelete,
  isDeleting = false,
}: FlightDetailsPanelProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !flight) return null;

  const departureLabel = [
    flight.departureAirport,
    flight.departureCity,
    flight.departureCountry,
  ]
    .filter(Boolean)
    .join(", ");

  const arrivalLabel = [
    flight.arrivalAirport,
    flight.arrivalCity,
    flight.arrivalCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <button
        type="button"
        aria-label="Close flight details"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] md:bg-black/40"
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed z-50 flex h-[100dvh] w-full flex-col border-l border-[#303846]/80 bg-[#0E1219]/95 text-foreground shadow-2xl backdrop-blur-xl",
          "inset-x-0 bottom-0 md:inset-x-auto md:inset-y-0 md:right-0 md:w-full md:max-w-md"
        )}
      >
        <div className="flex items-start justify-between border-b border-[#303846]/70 px-5 py-4">
          <div>
            <p className="text-sm text-[#94A3B8]">
              {flight.airline ?? "Unknown airline"}
            </p>
            <h2 className="text-xl font-semibold tracking-tight">
              {flight.flightNumber ?? "Flight"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {flight.departureIata} → {flight.arrivalIata}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <DetailRow label="Departure" value={departureLabel} />
          <DetailRow label="Arrival" value={arrivalLabel} />
          <Separator className="bg-[#303846]/70" />
          <DetailRow label="Date" value={formatFlightDate(flight.departureDate)} />
          <DetailRow label="Aircraft" value={flight.aircraft} />
          <DetailRow label="Cabin class" value={flight.cabinClass} />
          <DetailRow label="Seat" value={flight.seat} />
          <DetailRow
            label="Distance"
            value={formatDistanceKm(flight.distanceKm)}
          />
          <DetailRow label="Notes" value={flight.notes} />
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[#303846]/70 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onEdit(flight)}
            disabled={isDeleting}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onDelete(flight)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}

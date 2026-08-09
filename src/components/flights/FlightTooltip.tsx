import { type Flight } from "@/lib/flights/types";
import { formatFlightDate } from "@/lib/flights/utils";

interface FlightRouteTooltipProps {
  flight: Flight;
}

export function FlightRouteTooltip({ flight }: FlightRouteTooltipProps) {
  const airline = flight.airline ?? "Unknown airline";
  const flightNumber = flight.flightNumber ?? "—";
  const aircraft = flight.aircraft ?? flight.aircraftTypeCode ?? "—";

  return (
    <div className="pointer-events-none min-w-[11rem] max-w-[16rem] rounded-xl border border-[#303846]/90 bg-[#080b10]/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur-md">
      <p className="font-semibold text-[#f8fafc]">
        {airline} {flightNumber}
      </p>
      <p className="mt-1 text-[#cbd5e1]">
        {flight.departureIata} → {flight.arrivalIata}
      </p>
      <p className="mt-1 text-[#94a3b8]">{formatFlightDate(flight.departureDate)}</p>
      <p className="mt-1 text-[#94a3b8]">{aircraft}</p>
    </div>
  );
}

interface FlightAirportTooltipProps {
  name: string;
  iata: string;
  visitCount: number;
}

export function FlightAirportTooltip({
  name,
  iata,
  visitCount,
}: FlightAirportTooltipProps) {
  return (
    <div className="pointer-events-none min-w-[9rem] max-w-[14rem] rounded-xl border border-[#303846]/90 bg-[#080b10]/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur-md">
      <p className="font-semibold text-[#f8fafc]">
        {iata} · {name}
      </p>
      <p className="mt-1 text-[#94a3b8]">
        {visitCount} visit{visitCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}

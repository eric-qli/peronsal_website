import { type Flight, type FlightStats } from "@/lib/flights/types";

export function computeFlightStats(flights: Flight[]): FlightStats {
  const airportCodes = new Set<string>();
  const countries = new Set<string>();

  let totalDistanceKm = 0;

  for (const flight of flights) {
    airportCodes.add(flight.departureIata);
    airportCodes.add(flight.arrivalIata);

    if (flight.departureCountry) {
      countries.add(flight.departureCountry);
    }
    if (flight.arrivalCountry) {
      countries.add(flight.arrivalCountry);
    }

    if (flight.distanceKm !== null) {
      totalDistanceKm += flight.distanceKm;
    }
  }

  return {
    totalFlights: flights.length,
    totalDistanceKm,
    uniqueAirports: airportCodes.size,
    uniqueCountries: countries.size,
  };
}

export function formatFlightDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

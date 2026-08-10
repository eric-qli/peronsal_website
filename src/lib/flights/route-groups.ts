import { type Flight } from "@/lib/flights/types";

export type FlightVisualizationMode = "routes" | "individual";

export interface AggregatedRoute {
  key: string;
  /** Lexicographically first IATA in the undirected pair (display A). */
  airportA: string;
  /** Lexicographically second IATA in the undirected pair (display B). */
  airportB: string;
  latA: number;
  lngA: number;
  latB: number;
  lngB: number;
  nameA: string;
  nameB: string;
  cityA: string;
  cityB: string;
  flightCount: number;
  totalDistanceKm: number;
  firstFlightDate: string;
  lastFlightDate: string;
  /** Flights newest-first; each keeps its true direction. */
  flights: Flight[];
}

function compareFlightsByDateDesc(a: Flight, b: Flight): number {
  const dateCompare = b.departureDate.localeCompare(a.departureDate);
  if (dateCompare !== 0) return dateCompare;
  return b.createdAt.localeCompare(a.createdAt);
}

/** Undirected airport-pair key: YVR↔YYZ and YYZ↔YVR share the same group. */
export function getRouteKey(
  departureIata: string,
  arrivalIata: string
): string {
  return [departureIata, arrivalIata].sort().join("-");
}

export function getRouteKeyForFlight(flight: Flight): string {
  return getRouteKey(flight.departureIata, flight.arrivalIata);
}

/**
 * Aggregate flights by unordered airport pair for Routes-mode visualization.
 * Individual flight records keep their true origin → destination direction.
 */
export function groupFlightsByRoute(flights: Flight[]): AggregatedRoute[] {
  const groups = new Map<string, Flight[]>();

  for (const flight of flights) {
    const key = getRouteKeyForFlight(flight);
    const group = groups.get(key) ?? [];
    group.push(flight);
    groups.set(key, group);
  }

  const routes: AggregatedRoute[] = [];

  for (const [key, groupFlights] of groups) {
    const sorted = [...groupFlights].sort(compareFlightsByDateDesc);
    const [airportA, airportB] = key.split("-");

    const sampleA =
      sorted.find((flight) => flight.departureIata === airportA) ??
      sorted.find((flight) => flight.arrivalIata === airportA) ??
      sorted[0];
    const sampleB =
      sorted.find((flight) => flight.departureIata === airportB) ??
      sorted.find((flight) => flight.arrivalIata === airportB) ??
      sorted[0];

    const aIsDepartureOnSample = sampleA.departureIata === airportA;
    const bIsDepartureOnSample = sampleB.departureIata === airportB;

    let totalDistanceKm = 0;
    for (const flight of sorted) {
      if (flight.distanceKm !== null) {
        totalDistanceKm += flight.distanceKm;
      }
    }

    const dates = sorted.map((flight) => flight.departureDate).sort();

    routes.push({
      key,
      airportA,
      airportB,
      latA: aIsDepartureOnSample ? sampleA.departureLat : sampleA.arrivalLat,
      lngA: aIsDepartureOnSample ? sampleA.departureLng : sampleA.arrivalLng,
      latB: bIsDepartureOnSample ? sampleB.departureLat : sampleB.arrivalLat,
      lngB: bIsDepartureOnSample ? sampleB.departureLng : sampleB.arrivalLng,
      nameA: aIsDepartureOnSample
        ? (sampleA.departureAirport ?? airportA)
        : (sampleA.arrivalAirport ?? airportA),
      nameB: bIsDepartureOnSample
        ? (sampleB.departureAirport ?? airportB)
        : (sampleB.arrivalAirport ?? airportB),
      cityA: aIsDepartureOnSample
        ? (sampleA.departureCity ?? "")
        : (sampleA.arrivalCity ?? ""),
      cityB: bIsDepartureOnSample
        ? (sampleB.departureCity ?? "")
        : (sampleB.arrivalCity ?? ""),
      flightCount: sorted.length,
      totalDistanceKm,
      firstFlightDate: dates[0] ?? "",
      lastFlightDate: dates[dates.length - 1] ?? "",
      flights: sorted,
    });
  }

  return routes.sort((a, b) => {
    if (b.flightCount !== a.flightCount) return b.flightCount - a.flightCount;
    return a.key.localeCompare(b.key);
  });
}

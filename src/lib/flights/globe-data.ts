import {
  getArcControlPoints,
  getRouteVisualStyle,
  type GlobePathPoint,
  type RouteVisualStyle,
} from "@/lib/flights/globe-arc-geometry";
import {
  getRouteKeyForFlight,
  groupFlightsByRoute,
  type AggregatedRoute,
} from "@/lib/flights/route-groups";
import { buildRouteLayoutByFlightId } from "@/lib/flights/arc-layout";
import { type Flight } from "@/lib/flights/types";
import { formatDistanceKm } from "@/lib/flights/distance";
import { formatFlightDate } from "@/lib/flights/utils";

/** Unified path datum for Routes + Individual (sampled slerp, not Bezier arcs). */
export interface GlobePathDatum {
  id: string;
  kind: "route" | "flight";
  routeKey: string;
  route: AggregatedRoute | null;
  flight: Flight | null;
  routeIndex: number;
  routeCount: number;
  points: GlobePathPoint[];
  style: RouteVisualStyle;
  isGlow: boolean;
  animateDash: boolean;
}

export interface GlobeAirportDatum {
  iata: string;
  lat: number;
  lng: number;
  name: string;
  city: string;
  country: string;
  visitCount: number;
  departures: number;
  arrivals: number;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Aggregated Routes mode: one spherical great-circle path per airport pair. */
export function flightsToAggregatedRoutePaths(
  flights: Flight[]
): GlobePathDatum[] {
  const routes = groupFlightsByRoute(flights);
  const paths: GlobePathDatum[] = [];

  for (const route of routes) {
    const avgDistance =
      route.flightCount > 0 ? route.totalDistanceKm / route.flightCount : 2500;
    const points = getArcControlPoints(
      route.latA,
      route.lngA,
      route.latB,
      route.lngB,
      0,
      1,
      avgDistance
    );
    const style = getRouteVisualStyle(route.flightCount);
    const base = {
      id: route.key,
      kind: "route" as const,
      routeKey: route.key,
      route,
      flight: null,
      routeIndex: 0,
      routeCount: 1,
      points,
      style,
      animateDash: true,
    };

    paths.push({ ...base, isGlow: true });
    paths.push({ ...base, id: `${route.key}-core`, isGlow: false });
  }

  return paths;
}

/** Individual Flights mode: one spherical path per flight. */
export function flightsToIndividualFlightPaths(
  flights: Flight[]
): GlobePathDatum[] {
  const layoutByFlightId = buildRouteLayoutByFlightId(flights);
  const paths: GlobePathDatum[] = [];

  for (const flight of flights) {
    const layout = layoutByFlightId.get(flight.id) ?? {
      routeIndex: 0,
      routeCount: 1,
    };
    const distanceKm = flight.distanceKm ?? 2500;
    const points = getArcControlPoints(
      flight.departureLat,
      flight.departureLng,
      flight.arrivalLat,
      flight.arrivalLng,
      layout.routeIndex,
      layout.routeCount,
      distanceKm
    );
    const style = getRouteVisualStyle(1);
    const base = {
      id: flight.id,
      kind: "flight" as const,
      routeKey: getRouteKeyForFlight(flight),
      route: null,
      flight,
      routeIndex: layout.routeIndex,
      routeCount: layout.routeCount,
      points,
      style,
      animateDash: true,
    };

    paths.push({ ...base, isGlow: true });
    paths.push({ ...base, id: `${flight.id}-core`, isGlow: false });
  }

  return paths;
}

export function flightsToGlobeAirports(flights: Flight[]): GlobeAirportDatum[] {
  const airports = new Map<string, GlobeAirportDatum>();

  for (const flight of flights) {
    const upsertAirport = (
      iata: string,
      lat: number,
      lng: number,
      name: string | null,
      city: string | null,
      country: string | null,
      role: "departure" | "arrival"
    ) => {
      const existing = airports.get(iata) ?? {
        iata,
        lat,
        lng,
        name: name ?? iata,
        city: city ?? "",
        country: country ?? "",
        visitCount: 0,
        departures: 0,
        arrivals: 0,
      };

      existing.visitCount += 1;
      if (role === "departure") {
        existing.departures += 1;
      } else {
        existing.arrivals += 1;
      }

      if (name) existing.name = name;
      if (city) existing.city = city;
      if (country) existing.country = country;

      airports.set(iata, existing);
    };

    upsertAirport(
      flight.departureIata,
      flight.departureLat,
      flight.departureLng,
      flight.departureAirport,
      flight.departureCity,
      flight.departureCountry,
      "departure"
    );
    upsertAirport(
      flight.arrivalIata,
      flight.arrivalLat,
      flight.arrivalLng,
      flight.arrivalAirport,
      flight.arrivalCity,
      flight.arrivalCountry,
      "arrival"
    );
  }

  return Array.from(airports.values());
}

export function renderAggregatedRouteLabelHtml(route: AggregatedRoute): string {
  return `
    <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.45; color: #f8fafc; min-width: 10rem;">
      <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(route.airportA)} ↔ ${escapeHtml(route.airportB)}</div>
      <div style="color: #cbd5e1; margin-bottom: 2px;">${route.flightCount} flight${route.flightCount === 1 ? "" : "s"}</div>
      <div style="color: #94a3b8; margin-bottom: 2px;">Distance flown: ${escapeHtml(formatDistanceKm(route.totalDistanceKm))}</div>
      ${
        route.firstFlightDate
          ? `<div style="color: #64748b; margin-top: 4px;">First: ${escapeHtml(formatFlightDate(route.firstFlightDate))}</div>`
          : ""
      }
      ${
        route.lastFlightDate
          ? `<div style="color: #64748b;">Latest: ${escapeHtml(formatFlightDate(route.lastFlightDate))}</div>`
          : ""
      }
    </div>
  `;
}

export function renderFlightPathLabelHtml(flight: Flight): string {
  const airline = flight.airline ?? "Unknown airline";
  const flightNumber = flight.flightNumber ?? "—";

  return `
    <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.45; color: #f8fafc;">
      <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(airline)} ${escapeHtml(flightNumber)}</div>
      <div style="color: #cbd5e1; margin-bottom: 4px;">${escapeHtml(flight.departureIata)} → ${escapeHtml(flight.arrivalIata)}</div>
      <div style="color: #94a3b8;">${escapeHtml(formatFlightDate(flight.departureDate))}</div>
    </div>
  `;
}

export function renderAirportLabelHtml(airport: GlobeAirportDatum): string {
  const location = [airport.city, airport.country].filter(Boolean).join(", ");

  return `
    <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.45; color: #f8fafc; max-width: 220px;">
      <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(airport.iata)} · ${escapeHtml(airport.name)}</div>
      ${location ? `<div style="color: #cbd5e1; margin-bottom: 4px;">${escapeHtml(location)}</div>` : ""}
      <div style="color: #94a3b8;">${airport.visitCount} visit${airport.visitCount === 1 ? "" : "s"}</div>
    </div>
  `;
}

export function rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

import { type Flight } from "@/lib/flights/types";
import {
  buildRouteLayoutByFlightId,
  calculateGlobeArcAltitude,
  getRoutePairKey,
  fanRouteEndpoints,
} from "@/lib/flights/arc-layout";

export interface GlobeArcDatum {
  id: string;
  flight: Flight;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  altitude: number;
  routeIndex: number;
  routePairKey: string;
  isGlow: boolean;
}

export interface GlobeAirportDatum {
  iata: string;
  lat: number;
  lng: number;
  name: string;
  city: string;
  country: string;
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

export function flightsToGlobeArcs(flights: Flight[]): GlobeArcDatum[] {
  const routeLayoutByFlightId = buildRouteLayoutByFlightId(flights);
  const arcs: GlobeArcDatum[] = [];

  for (const flight of flights) {
    const layout = routeLayoutByFlightId.get(flight.id) ?? {
      routeIndex: 0,
      routeCount: 1,
    };
    const altitude = calculateGlobeArcAltitude(flight);
    const endpoints = fanRouteEndpoints(
      flight.departureLat,
      flight.departureLng,
      flight.arrivalLat,
      flight.arrivalLng,
      layout.routeIndex,
      layout.routeCount
    );
    const base = {
      id: flight.id,
      flight,
      startLat: endpoints.startLat,
      startLng: endpoints.startLng,
      endLat: endpoints.endLat,
      endLng: endpoints.endLng,
      altitude,
      routeIndex: layout.routeIndex,
      routePairKey: getRoutePairKey(flight),
    };

    arcs.push({ ...base, isGlow: true });
    arcs.push({ ...base, id: `${flight.id}-core`, isGlow: false });
  }

  return arcs;
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
        departures: 0,
        arrivals: 0,
      };

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

export function renderAirportLabelHtml(airport: GlobeAirportDatum): string {
  const location = [airport.city, airport.country].filter(Boolean).join(", ");

  return `
    <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.45; color: #f8fafc; max-width: 220px;">
      <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(airport.iata)} · ${escapeHtml(airport.name)}</div>
      ${location ? `<div style="color: #cbd5e1; margin-bottom: 4px;">${escapeHtml(location)}</div>` : ""}
      <div style="color: #94a3b8;">${airport.departures} departures · ${airport.arrivals} arrivals</div>
    </div>
  `;
}

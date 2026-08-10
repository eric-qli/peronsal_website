import { type GeoProjection } from "d3-geo";
import {
  buildRouteLayoutByFlightId,
  getRoutePairKey,
} from "@/lib/flights/arc-layout";
import {
  buildFlightRouteGeometry,
  type RouteDistanceStyle,
} from "@/lib/flights/route-geometry";
import { projectPoint } from "@/lib/flights/map-projection";
import { type Flight } from "@/lib/flights/types";

export interface MapRouteDatum {
  id: string;
  flight: Flight;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  routeIndex: number;
  routePairKey: string;
  /** One or more SVG path segments (split at the dateline / projection seams). */
  paths: string[];
  style: RouteDistanceStyle;
  distanceKm: number;
}

export interface MapAirportDatum {
  iata: string;
  lat: number;
  lng: number;
  name: string;
  city: string;
  country: string;
  visitCount: number;
  departures: number;
  arrivals: number;
  x: number;
  y: number;
}

export function flightsToMapRoutes(
  flights: Flight[],
  projection: GeoProjection
): MapRouteDatum[] {
  const routeLayoutByFlightId = buildRouteLayoutByFlightId(flights);
  const routes: MapRouteDatum[] = [];

  for (const flight of flights) {
    const layout = routeLayoutByFlightId.get(flight.id) ?? {
      routeIndex: 0,
      routeCount: 1,
    };

    const geometry = buildFlightRouteGeometry(
      flight.departureLng,
      flight.departureLat,
      flight.arrivalLng,
      flight.arrivalLat,
      projection,
      layout.routeIndex,
      flight.distanceKm
    );

    if (geometry.paths.length === 0) continue;

    routes.push({
      id: flight.id,
      flight,
      // Always keep true airport coordinates.
      startLat: flight.departureLat,
      startLng: flight.departureLng,
      endLat: flight.arrivalLat,
      endLng: flight.arrivalLng,
      routeIndex: layout.routeIndex,
      routePairKey: getRoutePairKey(flight),
      paths: geometry.paths,
      style: geometry.style,
      distanceKm: geometry.distanceKm,
    });
  }

  return routes;
}

export function flightsToMapAirports(
  flights: Flight[],
  projection: GeoProjection
): MapAirportDatum[] {
  const airports = new Map<string, MapAirportDatum>();

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
      const projected = projectPoint(lng, lat, projection);
      if (!projected) return;

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
        x: projected[0],
        y: projected[1],
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
      existing.x = projected[0];
      existing.y = projected[1];

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

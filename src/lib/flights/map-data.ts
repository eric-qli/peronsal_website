import { type Flight } from "@/lib/flights/types";
import {
  buildRouteLayoutByFlightId,
  fanRouteEndpoints,
  getRoutePairKey,
} from "@/lib/flights/arc-layout";
import { type GeoProjection } from "d3-geo";
import { buildRouteSvgPath, projectPoint } from "@/lib/flights/map-projection";

/** Smaller lateral offset than the globe so parallel routes stay readable on a flat map. */
const MAP_FAN_OFFSET_SCALE = 0.22;

export interface MapRouteDatum {
  id: string;
  flight: Flight;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  routeIndex: number;
  routePairKey: string;
  path: string;
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

function fanRouteEndpointsForMap(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  routeIndex: number,
  routeCount: number
): { startLat: number; startLng: number; endLat: number; endLng: number } {
  const fanned = fanRouteEndpoints(
    startLat,
    startLng,
    endLat,
    endLng,
    routeIndex,
    routeCount
  );

  if (routeCount <= 1) {
    return fanned;
  }

  const blend = (from: number, to: number) => from + (to - from) * MAP_FAN_OFFSET_SCALE;

  return {
    startLat: blend(startLat, fanned.startLat),
    startLng: blend(startLng, fanned.startLng),
    endLat: blend(endLat, fanned.endLat),
    endLng: blend(endLng, fanned.endLng),
  };
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

    const endpoints = fanRouteEndpointsForMap(
      flight.departureLat,
      flight.departureLng,
      flight.arrivalLat,
      flight.arrivalLng,
      layout.routeIndex,
      layout.routeCount
    );

    routes.push({
      id: flight.id,
      flight,
      startLat: endpoints.startLat,
      startLng: endpoints.startLng,
      endLat: endpoints.endLat,
      endLng: endpoints.endLng,
      routeIndex: layout.routeIndex,
      routePairKey: getRoutePairKey(flight),
      path: buildRouteSvgPath(
        endpoints.startLng,
        endpoints.startLat,
        endpoints.endLng,
        endpoints.endLat,
        projection
      ),
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

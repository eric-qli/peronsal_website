import { type Flight } from "@/lib/flights/types";
import { calculateDistanceKm } from "@/lib/flights/distance";

/** Undirected airport pair key (A→B and B→A share the same group). */
export function getRoutePairKey(flight: Flight): string {
  return [flight.departureIata, flight.arrivalIata].sort().join("-");
}

/** @deprecated Use getRoutePairKey for duplicate-route grouping. */
export function getRouteGroupKey(flight: Flight): string {
  return getRoutePairKey(flight);
}

function compareFlightsWithinRouteGroup(a: Flight, b: Flight): number {
  const dateCompare = a.departureDate.localeCompare(b.departureDate);
  if (dateCompare !== 0) return dateCompare;

  const createdCompare = a.createdAt.localeCompare(b.createdAt);
  if (createdCompare !== 0) return createdCompare;

  return a.id.localeCompare(b.id);
}

const MIN_ARC_ALTITUDE = 0.05;
const MAX_ARC_ALTITUDE = 0.2;
/** Minimum endpoint spread for duplicate routes (km). */
const MIN_FAN_OFFSET_KM = 120;
/** Maximum endpoint spread for duplicate routes (km). */
const MAX_FAN_OFFSET_KM = 350;

export interface RouteLayout {
  routeIndex: number;
  routeCount: number;
}

export function buildRouteLayoutByFlightId(
  flights: Flight[]
): Map<string, RouteLayout> {
  const groups = new Map<string, Flight[]>();

  for (const flight of flights) {
    const key = getRoutePairKey(flight);
    const group = groups.get(key) ?? [];
    group.push(flight);
    groups.set(key, group);
  }

  const layoutByFlightId = new Map<string, RouteLayout>();

  for (const groupFlights of groups.values()) {
    const sorted = [...groupFlights].sort(compareFlightsWithinRouteGroup);
    sorted.forEach((flight, index) => {
      layoutByFlightId.set(flight.id, {
        routeIndex: index,
        routeCount: sorted.length,
      });
    });
  }

  return layoutByFlightId;
}

export function buildRouteIndexByFlightId(
  flights: Flight[]
): Map<string, number> {
  const layout = buildRouteLayoutByFlightId(flights);
  const routeIndexByFlightId = new Map<string, number>();

  for (const [flightId, { routeIndex }] of layout) {
    routeIndexByFlightId.set(flightId, routeIndex);
  }

  return routeIndexByFlightId;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function initialBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaLng = toRadians(lng2 - lng1);

  const y = Math.sin(deltaLng) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLng);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function destinationPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceKm: number
): { lat: number; lng: number } {
  const angularDistance = distanceKm / EARTH_RADIUS_KM;
  const bearing = toRadians(bearingDeg);
  const phi1 = toRadians(lat);
  const lambda1 = toRadians(lng);

  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(angularDistance) +
      Math.cos(phi1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(phi1),
      Math.cos(angularDistance) - Math.sin(phi1) * Math.sin(phi2)
    );

  return { lat: toDegrees(phi2), lng: toDegrees(lambda2) };
}

/**
 * Fan duplicate routes around the great-circle axis so they share altitude
 * but appear side-by-side. Routes are spaced by 180° / n; for n=2 that is ±90°
 * from center (one arc tilted each way). Endpoints shift in opposite directions
 * so the great circle actually changes (parallel shifts would overlap).
 */
export function fanRouteEndpoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  routeIndex: number,
  routeCount: number
): { startLat: number; startLng: number; endLat: number; endLng: number } {
  if (routeCount <= 1) {
    return { startLat, startLng, endLat, endLng };
  }

  const routeBearing = initialBearing(startLat, startLng, endLat, endLng);
  const angularStep = 180 / routeCount;
  const routeAngle = (routeIndex - (routeCount - 1) / 2) * angularStep;

  const routeDistanceKm = calculateDistanceKm(
    startLat,
    startLng,
    endLat,
    endLng
  );
  const offsetKm = Math.min(
    MAX_FAN_OFFSET_KM,
    Math.max(MIN_FAN_OFFSET_KM, routeDistanceKm * 0.1)
  );

  // Perpendicular to the route, rotated by routeAngle around the route axis.
  const fanBearing = (routeBearing + 90 + routeAngle + 360) % 360;
  const oppositeBearing = (fanBearing + 180) % 360;

  const shiftedStart = destinationPoint(
    startLat,
    startLng,
    fanBearing,
    offsetKm
  );
  const shiftedEnd = destinationPoint(
    endLat,
    endLng,
    oppositeBearing,
    offsetKm
  );

  return {
    startLat: shiftedStart.lat,
    startLng: shiftedStart.lng,
    endLat: shiftedEnd.lat,
    endLng: shiftedEnd.lng,
  };
}

/** @deprecated Use fanRouteEndpoints */
export function offsetRouteEndpoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  routeIndex: number,
  routeCount: number
): { startLat: number; startLng: number; endLat: number; endLng: number } {
  return fanRouteEndpoints(
    startLat,
    startLng,
    endLat,
    endLng,
    routeIndex,
    routeCount
  );
}

export function calculateGlobeArcAltitude(flight: Flight): number {
  const distance = flight.distanceKm ?? 2500;
  const normalized = Math.min(1, Math.max(0, distance / 12000));

  return MIN_ARC_ALTITUDE + normalized * (MAX_ARC_ALTITUDE - MIN_ARC_ALTITUDE);
}

export interface GlobePointOfView {
  lat: number;
  lng: number;
  altitude: number;
}

export function computeInitialPointOfView(flights: Flight[]): GlobePointOfView {
  if (flights.length === 0) {
    return { lat: 18, lng: 0, altitude: 2.45 };
  }

  let latSum = 0;
  let lngSum = 0;
  let count = 0;

  for (const flight of flights) {
    latSum += flight.departureLat + flight.arrivalLat;
    lngSum += flight.departureLng + flight.arrivalLng;
    count += 2;
  }

  return {
    lat: latSum / count,
    lng: lngSum / count,
    altitude: 2.15,
  };
}

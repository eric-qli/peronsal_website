import { geoInterpolate } from "d3-geo";
import { type GeoProjection } from "d3-geo";
import { calculateDistanceKm } from "@/lib/flights/distance";

export type LngLat = [number, number];

export interface RouteDistanceStyle {
  /** Extra mid-path offset (km) for visual arc emphasis; endpoints stay fixed. */
  bulgeKm: number;
  samples: number;
  coreOpacity: number;
  glowOpacity: number;
  coreWidth: number;
  glowWidth: number;
  coreWidthHover: number;
  glowWidthHover: number;
}

const EARTH_RADIUS_KM = 6371;
/** Split projected segments when consecutive points jump farther than this (px). */
const PROJECTED_JUMP_THRESHOLD_PX = 80;
/** Base lateral fan spacing between duplicate city-pair arcs (km at midpoint). */
const DUPLICATE_FAN_BASE_KM = 48;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function normalizeLongitude(lng: number): number {
  let value = ((lng + 180) % 360 + 360) % 360 - 180;
  if (value === -180) return 180;
  return value;
}

/** Unwrap longitude so it stays continuous relative to a reference longitude. */
export function unwrapLongitude(lng: number, referenceLng: number): number {
  let adjusted = lng;
  while (adjusted - referenceLng > 180) adjusted -= 360;
  while (adjusted - referenceLng < -180) adjusted += 360;
  return adjusted;
}

function lngLatToCartesian(lng: number, lat: number): [number, number, number] {
  const lambda = toRadians(lng);
  const phi = toRadians(lat);
  const cosPhi = Math.cos(phi);
  return [cosPhi * Math.cos(lambda), cosPhi * Math.sin(lambda), Math.sin(phi)];
}

function cartesianToLngLat(x: number, y: number, z: number): LngLat {
  return [
    normalizeLongitude(toDegrees(Math.atan2(y, x))),
    toDegrees(Math.atan2(z, Math.hypot(x, y))),
  ];
}

function crossProduct(
  a: [number, number, number],
  b: [number, number, number]
): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function normalizeVector(
  v: [number, number, number]
): [number, number, number] | null {
  const length = Math.hypot(v[0], v[1], v[2]);
  if (length < 1e-12) return null;
  return [v[0] / length, v[1] / length, v[2] / length];
}

/**
 * Destination point given start, bearing (deg), and distance (km).
 * Endpoints of routes should call this only for intermediate offsets.
 */
export function destinationPoint(
  lng: number,
  lat: number,
  bearingDeg: number,
  distanceKm: number
): LngLat {
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

  return [normalizeLongitude(toDegrees(lambda2)), toDegrees(phi2)];
}

export function initialBearing(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number
): number {
  const phi1 = toRadians(startLat);
  const phi2 = toRadians(endLat);
  const deltaLng = toRadians(endLng - startLng);

  const y = Math.sin(deltaLng) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLng);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Signed lateral fan offset (km) for duplicate city-pair routes.
 * Index pattern: 0, +offset, -offset, +2offset, -2offset…
 */
export function calculateRouteOffset(
  routeIndex: number,
  baseOffsetKm: number = DUPLICATE_FAN_BASE_KM
): number {
  if (routeIndex <= 0) return 0;
  const step = Math.ceil(routeIndex / 2);
  const sign = routeIndex % 2 === 1 ? 1 : -1;
  return sign * step * baseOffsetKm;
}

/**
 * Distance-based visual style for airline-map arcs.
 * Longer flights get denser sampling and a stronger mid-path bulge.
 */
export function getRouteStyleByDistance(distanceKm: number): RouteDistanceStyle {
  if (distanceKm < 1500) {
    return {
      bulgeKm: 12,
      samples: 48,
      coreOpacity: 0.55,
      glowOpacity: 0.16,
      coreWidth: 0.9,
      glowWidth: 2.4,
      coreWidthHover: 1.35,
      glowWidthHover: 3.4,
    };
  }

  if (distanceKm < 5000) {
    return {
      bulgeKm: 55,
      samples: 72,
      coreOpacity: 0.62,
      glowOpacity: 0.18,
      coreWidth: 1,
      glowWidth: 2.6,
      coreWidthHover: 1.45,
      glowWidthHover: 3.6,
    };
  }

  if (distanceKm < 9000) {
    return {
      bulgeKm: 140,
      samples: 100,
      coreOpacity: 0.68,
      glowOpacity: 0.2,
      coreWidth: 1.05,
      glowWidth: 2.8,
      coreWidthHover: 1.55,
      glowWidthHover: 3.8,
    };
  }

  return {
    bulgeKm: 220,
    samples: 128,
    coreOpacity: 0.72,
    glowOpacity: 0.22,
    coreWidth: 1.1,
    glowWidth: 3,
    coreWidthHover: 1.65,
    glowWidthHover: 4,
  };
}

/**
 * Sample true great-circle points between two airports (spherical interpolation).
 * Longitudes are unwrapped relative to the departure so the Pacific path stays continuous.
 */
export function generateGreatCirclePoints(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  samples = 64
): LngLat[] {
  const interpolate = geoInterpolate([startLng, startLat], [endLng, endLat]);
  const points: LngLat[] = [];
  let referenceLng = startLng;

  for (let index = 0; index <= samples; index += 1) {
    const [rawLng, lat] = interpolate(index / samples);
    const lng = unwrapLongitude(rawLng, referenceLng);
    points.push([lng, lat]);
    referenceLng = lng;
  }

  return points;
}

/**
 * Split a geographic polyline wherever consecutive longitudes cross the dateline
 * (absolute jump greater than 180° after normalization).
 */
export function splitAtDateline(points: LngLat[]): LngLat[][] {
  if (points.length === 0) return [];

  const segments: LngLat[][] = [];
  let current: LngLat[] = [points[0]];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const point = points[index];
    const prevNorm = normalizeLongitude(previous[0]);
    const nextNorm = normalizeLongitude(point[0]);
    const jump = Math.abs(nextNorm - prevNorm);

    if (jump > 180) {
      if (current.length >= 2) {
        segments.push(current);
      }
      current = [point];
      continue;
    }

    current.push(point);
  }

  if (current.length >= 2) {
    segments.push(current);
  }

  return segments;
}

/**
 * Offset intermediate points perpendicular to the local great-circle direction.
 * Endpoints remain exactly at the true airport coordinates.
 * `signedOffsetKm` uses a sin(πt) envelope so the peak is at the midpoint.
 */
export function offsetRouteMidpoints(
  points: LngLat[],
  signedOffsetKm: number
): LngLat[] {
  if (points.length < 3 || signedOffsetKm === 0) {
    return points.map(([lng, lat]) => [normalizeLongitude(lng), lat]);
  }

  const start = lngLatToCartesian(points[0][0], points[0][1]);
  const end = lngLatToCartesian(
    points[points.length - 1][0],
    points[points.length - 1][1]
  );
  const perpendicular = normalizeVector(crossProduct(start, end));

  if (!perpendicular) {
    return points.map(([lng, lat]) => [normalizeLongitude(lng), lat]);
  }

  return points.map(([lng, lat], index) => {
    if (index === 0 || index === points.length - 1) {
      return [normalizeLongitude(lng), lat];
    }

    const t = index / (points.length - 1);
    const envelope = Math.sin(Math.PI * t);
    const offsetKm = signedOffsetKm * envelope;
    const angular = offsetKm / EARTH_RADIUS_KM;
    const point = lngLatToCartesian(lng, lat);

    const shifted: [number, number, number] = [
      point[0] + perpendicular[0] * angular,
      point[1] + perpendicular[1] * angular,
      point[2] + perpendicular[2] * angular,
    ];
    const normalized = normalizeVector(shifted);
    if (!normalized) {
      return [normalizeLongitude(lng), lat];
    }

    return cartesianToLngLat(normalized[0], normalized[1], normalized[2]);
  });
}

/**
 * Apply a gentle distance-based bulge on the poleward side of the great circle.
 * Keeps endpoints fixed; strengthens the aviation-style curve on long-haul flights.
 */
export function applyDistanceBulge(
  points: LngLat[],
  bulgeKm: number
): LngLat[] {
  if (points.length < 3 || bulgeKm <= 0) return points;

  const midIndex = Math.floor(points.length / 2);
  const positive = offsetRouteMidpoints(points, bulgeKm);
  const negative = offsetRouteMidpoints(points, -bulgeKm);

  return Math.abs(positive[midIndex][1]) >= Math.abs(negative[midIndex][1])
    ? positive
    : negative;
}

function projectLngLat(
  lng: number,
  lat: number,
  projection: GeoProjection
): [number, number] | null {
  // Keep unwrapped longitudes when possible so rotated Pacific views stay continuous.
  const projected = projection([lng, lat]);
  if (
    !projected ||
    !Number.isFinite(projected[0]) ||
    !Number.isFinite(projected[1])
  ) {
    const normalized = projection([normalizeLongitude(lng), lat]);
    if (
      !normalized ||
      !Number.isFinite(normalized[0]) ||
      !Number.isFinite(normalized[1])
    ) {
      return null;
    }
    return [normalized[0], normalized[1]];
  }
  return [projected[0], projected[1]];
}

/**
 * Project geographic segments and further split where screen-space jumps
 * (typical when the antimeridian falls inside a projected segment).
 */
export function projectAndSplitSegments(
  segments: LngLat[][],
  projection: GeoProjection
): Array<Array<[number, number]>> {
  const projectedSegments: Array<Array<[number, number]>> = [];

  for (const segment of segments) {
    let current: Array<[number, number]> = [];

    for (const [lng, lat] of segment) {
      const point = projectLngLat(lng, lat, projection);
      if (!point) {
        if (current.length >= 2) {
          projectedSegments.push(current);
        }
        current = [];
        continue;
      }

      if (current.length > 0) {
        const previous = current[current.length - 1];
        const dx = point[0] - previous[0];
        const dy = point[1] - previous[1];
        if (Math.hypot(dx, dy) > PROJECTED_JUMP_THRESHOLD_PX) {
          if (current.length >= 2) {
            projectedSegments.push(current);
          }
          current = [point];
          continue;
        }
      }

      current.push(point);
    }

    if (current.length >= 2) {
      projectedSegments.push(current);
    }
  }

  return projectedSegments;
}

export function projectedSegmentsToSvgPaths(
  segments: Array<Array<[number, number]>>
): string[] {
  return segments
    .map((segment) => {
      if (segment.length < 2) return "";
      return segment
        .map(([x, y], index) => (index === 0 ? `M${x},${y}` : `L${x},${y}`))
        .join(" ");
    })
    .filter((path) => path.length > 0);
}

export interface BuiltMapRouteGeometry {
  paths: string[];
  style: RouteDistanceStyle;
  distanceKm: number;
}

/**
 * Build SVG path segments for one flight: great-circle → fan/bulge →
 * dateline split → project → screen-space split.
 */
export function buildFlightRouteGeometry(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  projection: GeoProjection,
  routeIndex: number,
  distanceKm?: number | null
): BuiltMapRouteGeometry {
  const resolvedDistance =
    distanceKm ??
    calculateDistanceKm(startLat, startLng, endLat, endLng);
  const style = getRouteStyleByDistance(resolvedDistance);

  let points = generateGreatCirclePoints(
    startLng,
    startLat,
    endLng,
    endLat,
    style.samples
  );

  points = applyDistanceBulge(points, style.bulgeKm);
  points = offsetRouteMidpoints(points, calculateRouteOffset(routeIndex));

  // Re-pin true endpoints after any intermediate offsets.
  points[0] = [startLng, startLat];
  points[points.length - 1] = [endLng, endLat];

  // Project the continuous (longitude-unwrapped) great-circle first. Screen-space
  // jump detection splits only when the projection actually wraps. If that yields
  // nothing usable, fall back to an explicit geographic dateline split.
  let projectedSegments = projectAndSplitSegments([points], projection);
  if (projectedSegments.length === 0) {
    projectedSegments = projectAndSplitSegments(
      splitAtDateline(points),
      projection
    );
  }

  const paths = projectedSegmentsToSvgPaths(projectedSegments);

  return {
    paths,
    style,
    distanceKm: resolvedDistance,
  };
}

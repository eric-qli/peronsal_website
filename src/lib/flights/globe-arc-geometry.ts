export interface GlobePathPoint {
  lat: number;
  lng: number;
  alt: number;
}

export interface RouteVisualStyle {
  coreOpacity: number;
  glowOpacity: number;
  stroke: number;
  glowStroke: number;
}

type Vec3 = [number, number, number];

/**
 * Temporary: render pure great-circle + radial altitude only.
 * No lateral / altitude duplicate separation while verifying long-haul geometry.
 */
export const DISABLE_DUPLICATE_OFFSETS = true;

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

/**
 * Geographic → unit Cartesian.
 * Matches three-globe / d3 spherical convention used for markers:
 *   x = cos(lat) cos(lng)
 *   y = cos(lat) sin(lng)
 *   z = sin(lat)
 */
export function lngLatToCartesian(lng: number, lat: number): Vec3 {
  const lambda = toRadians(lng);
  const phi = toRadians(lat);
  const cosPhi = Math.cos(phi);
  return [cosPhi * Math.cos(lambda), cosPhi * Math.sin(lambda), Math.sin(phi)];
}

export function cartesianToLngLat(x: number, y: number, z: number): [number, number] {
  return [
    normalizeLongitude(toDegrees(Math.atan2(y, x))),
    toDegrees(Math.atan2(z, Math.hypot(x, y))),
  ];
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function length(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

function normalize(v: Vec3): Vec3 | null {
  const len = length(v);
  if (len < 1e-12) return null;
  return [v[0] / len, v[1] / len, v[2] / len];
}

/**
 * Shortest-arc spherical interpolation between unit vectors.
 * Always uses omega ∈ [0, π] so the long way around is never chosen.
 */
export function slerpUnit(a: Vec3, b: Vec3, t: number): Vec3 {
  const aN = normalize(a) ?? a;
  const bN = normalize(b) ?? b;
  let cosOmega = Math.max(-1, Math.min(1, dot(aN, bN)));

  // Near-identical points: fall back to normalized lerp.
  if (cosOmega > 0.999999) {
    return normalize(add(aN, scale(sub(bN, aN), t))) ?? aN;
  }

  // Antipodal / near-antipodal: pick a stable orthogonal axis.
  if (cosOmega < -0.999999) {
    const axisSeed =
      Math.abs(aN[0]) < 0.9 ? ([1, 0, 0] as Vec3) : ([0, 1, 0] as Vec3);
    const ortho = normalize(cross(aN, axisSeed)) ?? ([0, 0, 1] as Vec3);
    const omega = Math.PI;
    const w0 = Math.sin((1 - t) * omega);
    const w1 = Math.sin(t * omega);
    return (
      normalize([
        aN[0] * w0 + ortho[0] * w1,
        aN[1] * w0 + ortho[1] * w1,
        aN[2] * w0 + ortho[2] * w1,
      ]) ?? aN
    );
  }

  const omega = Math.acos(cosOmega);
  const sinOmega = Math.sin(omega);
  const w0 = Math.sin((1 - t) * omega) / sinOmega;
  const w1 = Math.sin(t * omega) / sinOmega;

  return (
    normalize([
      aN[0] * w0 + bN[0] * w1,
      aN[1] * w0 + bN[1] * w1,
      aN[2] * w0 + bN[2] * w1,
    ]) ?? aN
  );
}

/**
 * Symmetric duplicate index centered on 0 so the family of arcs
 * averages to the true great-circle:
 *   2 → -0.5, +0.5
 *   3 → -1, 0, +1
 */
export function getDuplicateOffsetIndex(
  routeIndex: number,
  routeCount: number
): number {
  if (routeCount <= 1) return 0;
  return routeIndex - (routeCount - 1) / 2;
}

/** Shared peak altitude for every route (globe-radius units). */
const BASE_ARC_ALTITUDE = 0.12;

/** Subtle per-duplicate altitude step around the shared base. */
const DUPLICATE_ALTITUDE_SPACING = 0.012;

/** Tiny lateral spacing in unit-globe space (only when offsets enabled). */
const LATERAL_SPACING = 0.004;

export function getBaseArcAltitude(_distanceKm?: number): number {
  return BASE_ARC_ALTITUDE;
}

export function getDuplicateAltitudeSpacing(_distanceKm?: number): number {
  return DUPLICATE_ALTITUDE_SPACING;
}

export function getDuplicateArcAltitude(
  distanceKm: number,
  routeIndex: number,
  routeCount: number
): number {
  if (DISABLE_DUPLICATE_OFFSETS) {
    return getBaseArcAltitude(distanceKm);
  }
  const base = getBaseArcAltitude(distanceKm);
  const spacing = getDuplicateAltitudeSpacing(distanceKm);
  const offsetIndex = getDuplicateOffsetIndex(routeIndex, routeCount);
  return Math.max(0.06, base + offsetIndex * spacing);
}

export function getLateralSeparationAmount(_distanceKm?: number): number {
  if (DISABLE_DUPLICATE_OFFSETS) return 0;
  return LATERAL_SPACING;
}

/** Frequency-based styling for aggregated Routes mode. */
export function getRouteVisualStyle(flightCount: number): RouteVisualStyle {
  if (flightCount <= 1) {
    return {
      coreOpacity: 0.88,
      glowOpacity: 0.34,
      stroke: 0.55,
      glowStroke: 1.35,
    };
  }

  if (flightCount <= 5) {
    return {
      coreOpacity: 0.92,
      glowOpacity: 0.4,
      stroke: 0.62,
      glowStroke: 1.5,
    };
  }

  if (flightCount <= 10) {
    return {
      coreOpacity: 0.95,
      glowOpacity: 0.46,
      stroke: 0.7,
      glowStroke: 1.7,
    };
  }

  return {
    coreOpacity: 0.98,
    glowOpacity: 0.52,
    stroke: 0.78,
    glowStroke: 1.9,
  };
}

function sampleCountForDistance(distanceKm: number): number {
  if (distanceKm >= 9000) return 160;
  if (distanceKm >= 7000) return 128;
  if (distanceKm >= 4000) return 96;
  return 64;
}

/**
 * Pure great-circle surface samples via slerp (no altitude, no offsets).
 */
export function sampleGreatCircleSurface(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  samples: number
): Vec3[] {
  const A = normalize(lngLatToCartesian(startLng, startLat));
  const B = normalize(lngLatToCartesian(endLng, endLat));
  if (!A || !B) return [];

  const points: Vec3[] = [];
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    points.push(slerpUnit(A, B, t));
  }
  return points;
}

/**
 * Flight / route arc as sampled spherical interpolation + radial altitude.
 *
 * Geographic direction comes ONLY from slerp(A, B, t).
 * Altitude is applied as a radial scale: |P| = 1 + baseAltitude * sin(πt).
 * Endpoints stay pinned to the airport lat/lng.
 */
export function getArcControlPoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  routeIndex: number,
  routeCount: number,
  distanceKm: number,
  samples?: number
): GlobePathPoint[] {
  const sampleCount = samples ?? sampleCountForDistance(distanceKm);
  const peakAltitude = getDuplicateArcAltitude(
    distanceKm,
    routeIndex,
    routeCount
  );
  const offsetIndex = DISABLE_DUPLICATE_OFFSETS
    ? 0
    : getDuplicateOffsetIndex(routeIndex, routeCount);
  const lateralAmount = getLateralSeparationAmount(distanceKm);

  const A = normalize(lngLatToCartesian(startLng, startLat));
  const B = normalize(lngLatToCartesian(endLng, endLat));
  if (!A || !B) {
    return [
      { lat: startLat, lng: startLng, alt: 0.001 },
      { lat: endLat, lng: endLng, alt: 0.001 },
    ];
  }

  const result: GlobePathPoint[] = [];

  for (let index = 0; index <= sampleCount; index += 1) {
    const t = index / sampleCount;

    if (index === 0) {
      result.push({ lat: startLat, lng: startLng, alt: 0.001 });
      continue;
    }
    if (index === sampleCount) {
      result.push({ lat: endLat, lng: endLng, alt: 0.001 });
      continue;
    }

    const surface = slerpUnit(A, B, t);
    const height = peakAltitude * Math.sin(Math.PI * t);
    const targetRadius = 1 + height;
    let point: Vec3 = scale(surface, targetRadius);

    // Geodesic-safe lateral offset in the local tangent frame (disabled by default).
    if (offsetIndex !== 0 && lateralAmount > 0) {
      const envelope = Math.sin(Math.PI * t);
      const epsilon = 1 / sampleCount;
      const prev = slerpUnit(A, B, Math.max(0, t - epsilon));
      const next = slerpUnit(A, B, Math.min(1, t + epsilon));
      const tangent = normalize(sub(next, prev));
      if (tangent) {
        const side = normalize(cross(surface, tangent));
        if (side) {
          point = add(point, scale(side, lateralAmount * offsetIndex * envelope));
          const rescaled = normalize(point);
          if (rescaled) {
            point = scale(rescaled, targetRadius);
          }
        }
      }
    }

    const [outLng, outLat] = cartesianToLngLat(point[0], point[1], point[2]);
    result.push({
      lat: outLat,
      lng: outLng,
      alt: Math.max(0.001, targetRadius - 1),
    });
  }

  return result;
}

export function getAggregatedArcAltitude(distanceKm: number): number {
  return getBaseArcAltitude(distanceKm);
}

export function computeRouteMidpoint(route: {
  latA: number;
  lngA: number;
  latB: number;
  lngB: number;
}): { lat: number; lng: number } {
  const A = normalize(lngLatToCartesian(route.lngA, route.latA));
  const B = normalize(lngLatToCartesian(route.lngB, route.latB));
  if (!A || !B) {
    return { lat: route.latA, lng: route.lngA };
  }
  const mid = slerpUnit(A, B, 0.5);
  const [lng, lat] = cartesianToLngLat(mid[0], mid[1], mid[2]);
  return { lat, lng };
}

import {
  geoInterpolate,
  geoNaturalEarth1,
  geoPath,
  type GeoPermissibleObjects,
  type GeoProjection,
} from "d3-geo";
import { type Flight } from "@/lib/flights/types";

export interface MapDimensions {
  width: number;
  height: number;
}

export interface MapPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Target padding so routes occupy ~60–80% of the viewport. */
export const MAP_FIT_PADDING_PX = 100;

const DEFAULT_PADDING: MapPadding = {
  top: MAP_FIT_PADDING_PX,
  right: MAP_FIT_PADDING_PX,
  bottom: MAP_FIT_PADDING_PX,
  left: MAP_FIT_PADDING_PX,
};

/** Minimum geographic span so a single airport does not over-zoom. */
const MIN_BOUNDS_SPAN_DEG = 6;

/** Fractional padding added to the computed geographic bounds. */
const BOUNDS_GEO_PADDING_RATIO = 0.14;

export interface FlightGeoBounds {
  west: number;
  south: number;
  east: number;
  north: number;
  centerLng: number;
  centerLat: number;
  crossesDateline: boolean;
}

/** Collect every airport coordinate from flights for bounds fitting. */
export function collectFlightCoordinates(
  flights: Flight[]
): Array<[number, number]> {
  const coordinates: Array<[number, number]> = [];

  for (const flight of flights) {
    coordinates.push([flight.departureLng, flight.departureLat]);
    coordinates.push([flight.arrivalLng, flight.arrivalLat]);
  }

  return coordinates;
}

/** Include sampled points along each great-circle route so curved paths stay in frame. */
export function collectFlightBoundsCoordinates(
  flights: Flight[]
): Array<[number, number]> {
  const coordinates = collectFlightCoordinates(flights);

  for (const flight of flights) {
    const interpolate = geoInterpolate(
      [flight.departureLng, flight.departureLat],
      [flight.arrivalLng, flight.arrivalLat]
    );

    for (let step = 1; step < 8; step += 1) {
      coordinates.push(interpolate(step / 8));
    }
  }

  return coordinates;
}

function longitudeSpan(lngs: number[]): number {
  if (lngs.length === 0) return 0;
  return Math.max(...lngs) - Math.min(...lngs);
}

function computeCenterLongitude(lngs: number[], crossesDateline: boolean): number {
  if (lngs.length === 0) return 0;

  if (!crossesDateline) {
    return (Math.min(...lngs) + Math.max(...lngs)) / 2;
  }

  const shifted = lngs.map((lng) => (lng < 0 ? lng + 360 : lng));
  const centerShifted = (Math.min(...shifted) + Math.max(...shifted)) / 2;
  return centerShifted > 180 ? centerShifted - 360 : centerShifted;
}

/** Compute geographic bounds with International Date Line handling. */
export function computeFlightGeoBounds(
  coordinates: Array<[number, number]>
): FlightGeoBounds | null {
  if (coordinates.length === 0) return null;

  const lngs = coordinates.map(([lng]) => lng);
  const lats = coordinates.map(([, lat]) => lat);
  const crossesDateline = longitudeSpan(lngs) > 180;

  let west: number;
  let east: number;

  if (crossesDateline) {
    const shifted = lngs.map((lng) => (lng < 0 ? lng + 360 : lng));
    west = Math.min(...shifted);
    east = Math.max(...shifted);

    if (west > 180) west -= 360;
    if (east > 180) east -= 360;
  } else {
    west = Math.min(...lngs);
    east = Math.max(...lngs);
  }

  let south = Math.min(...lats);
  let north = Math.max(...lats);

  const lngSpan = crossesDateline
    ? Math.max(...lngs.map((lng) => (lng < 0 ? lng + 360 : lng))) -
      Math.min(...lngs.map((lng) => (lng < 0 ? lng + 360 : lng)))
    : east - west;
  let latSpan = north - south;

  const lngPad = Math.max(1.5, lngSpan * BOUNDS_GEO_PADDING_RATIO);
  const latPad = Math.max(1.5, latSpan * BOUNDS_GEO_PADDING_RATIO);

  west -= lngPad;
  east += lngPad;
  south -= latPad;
  north += latPad;

  if (lngSpan < MIN_BOUNDS_SPAN_DEG) {
    const mid = (west + east) / 2;
    west = mid - MIN_BOUNDS_SPAN_DEG / 2;
    east = mid + MIN_BOUNDS_SPAN_DEG / 2;
  }

  if (latSpan < MIN_BOUNDS_SPAN_DEG) {
    const mid = (south + north) / 2;
    south = mid - MIN_BOUNDS_SPAN_DEG / 2;
    north = mid + MIN_BOUNDS_SPAN_DEG / 2;
  }

  south = Math.max(-85, south);
  north = Math.min(85, north);

  return {
    west,
    south,
    east,
    north,
    centerLng: computeCenterLongitude(lngs, crossesDateline),
    centerLat: (south + north) / 2,
    crossesDateline,
  };
}

function sanitizeCoordinates(
  coordinates: Array<[number, number]>
): Array<[number, number]> {
  return coordinates.filter(
    ([lng, lat]) =>
      Number.isFinite(lng) &&
      Number.isFinite(lat) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
  );
}

/** Minimum drawable area inside padding; prevents invalid fit boxes. */
const MIN_FIT_EXTENT_PX = 96;

export function normalizeMapPadding(
  dimensions: MapDimensions,
  padding: MapPadding
): MapPadding {
  const { width, height } = dimensions;
  const maxVerticalPadding = Math.max(
    MIN_FIT_EXTENT_PX,
    (height - MIN_FIT_EXTENT_PX) / 2
  );
  const maxHorizontalPadding = Math.max(
    MIN_FIT_EXTENT_PX,
    (width - MIN_FIT_EXTENT_PX) / 2
  );

  return {
    top: Math.min(padding.top, maxVerticalPadding),
    right: Math.min(padding.right, maxHorizontalPadding),
    bottom: Math.min(padding.bottom, maxVerticalPadding),
    left: Math.min(padding.left, maxHorizontalPadding),
  };
}

export function buildFitExtent(
  dimensions: MapDimensions,
  padding: MapPadding
): [[number, number], [number, number]] {
  const normalized = normalizeMapPadding(dimensions, padding);
  const x1 = Math.max(
    normalized.left + MIN_FIT_EXTENT_PX,
    dimensions.width - normalized.right
  );
  const y1 = Math.max(
    normalized.top + MIN_FIT_EXTENT_PX,
    dimensions.height - normalized.bottom
  );

  return [
    [normalized.left, normalized.top],
    [x1, y1],
  ];
}

export function isProjectionValid(projection: GeoProjection): boolean {
  const scale = projection.scale();
  const translate = projection.translate();

  if (!Number.isFinite(scale) || scale <= 0) return false;
  if (!Number.isFinite(translate[0]) || !Number.isFinite(translate[1])) {
    return false;
  }

  for (const coordinates of [
    [0, 0],
    [100, 35],
    [-120, 49],
  ] as Array<[number, number]>) {
    const projected = projection(coordinates);
    if (
      !projected ||
      !Number.isFinite(projected[0]) ||
      !Number.isFinite(projected[1])
    ) {
      return false;
    }
  }

  return true;
}

function createBaseProjection(): GeoProjection {
  return geoNaturalEarth1();
}

function projectCoordinateBounds(
  coordinates: Array<[number, number]>,
  projection: GeoProjection
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let count = 0;

  for (const [lng, lat] of coordinates) {
    const point = projection([lng, lat]);
    if (
      !point ||
      !Number.isFinite(point[0]) ||
      !Number.isFinite(point[1])
    ) {
      continue;
    }

    minX = Math.min(minX, point[0]);
    maxX = Math.max(maxX, point[0]);
    minY = Math.min(minY, point[1]);
    maxY = Math.max(maxY, point[1]);
    count += 1;
  }

  if (count === 0) return null;

  return { minX, minY, maxX, maxY };
}

function unwrapLongitudeForCenter(lng: number, centerLng: number): number {
  let adjusted = lng;
  while (adjusted - centerLng > 180) adjusted -= 360;
  while (adjusted - centerLng < -180) adjusted += 360;
  return adjusted;
}

/**
 * Fit projection without d3 fitExtent (avoids point[0] crashes in geoStream).
 * Uses rotate([-lng, 0]) so Pacific-centered clusters stay continuous instead of
 * wrapping across the Atlantic / Europe.
 */
function fitProjectionToCoordinates(
  coordinates: Array<[number, number]>,
  dimensions: MapDimensions,
  padding: MapPadding,
  center: [number, number]
): GeoProjection {
  const extent = buildFitExtent(dimensions, padding);
  const extentCenterX = (extent[0][0] + extent[1][0]) / 2;
  const extentCenterY = (extent[0][1] + extent[1][1]) / 2;
  const [centerLng, centerLat] = center;

  // Keep fitting points in a continuous longitude frame around the travel region.
  const unwrappedCoordinates = coordinates.map(
    ([lng, lat]) =>
      [unwrapLongitudeForCenter(lng, centerLng), lat] as [number, number]
  );

  const projection = createBaseProjection();
  // Rotate the globe so the travel region's center is in the middle of the map.
  projection.rotate([-centerLng, -centerLat * 0.35, 0]);
  projection.center([0, 0]);

  let lo = 40;
  let hi = 12000;
  let bestScale = 150;

  for (let iteration = 0; iteration < 32; iteration += 1) {
    const scale = (lo + hi) / 2;
    projection.scale(scale);
    projection.translate([extentCenterX, extentCenterY]);

    const bounds = projectCoordinateBounds(unwrappedCoordinates, projection);
    if (!bounds) {
      hi = scale;
      continue;
    }

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const extentWidth = extent[1][0] - extent[0][0];
    const extentHeight = extent[1][1] - extent[0][1];
    const fits = width <= extentWidth && height <= extentHeight;

    if (fits) {
      bestScale = scale;
      lo = scale;
    } else {
      hi = scale;
    }
  }

  projection.scale(bestScale * 0.9);
  projection.translate([extentCenterX, extentCenterY]);

  const bounds = projectCoordinateBounds(unwrappedCoordinates, projection);
  if (bounds) {
    const [translateX, translateY] = projection.translate();
    projection.translate([
      translateX + extentCenterX - (bounds.minX + bounds.maxX) / 2,
      translateY + extentCenterY - (bounds.minY + bounds.maxY) / 2,
    ]);
  }

  return projection;
}

function createWorldProjectionManual(
  dimensions: MapDimensions,
  padding: MapPadding
): GeoProjection {
  const extent = buildFitExtent(dimensions, padding);
  const centerX = (extent[0][0] + extent[1][0]) / 2;
  const centerY = (extent[0][1] + extent[1][1]) / 2;
  const extentWidth = extent[1][0] - extent[0][0];

  return createBaseProjection()
    .center([0, 10])
    .scale(extentWidth * 0.21)
    .translate([centerX, centerY]);
}

/** Clone projection transform state for animation/interpolation. */
export function cloneProjection(source: GeoProjection): GeoProjection {
  const clone = createBaseProjection();
  clone.scale(source.scale());
  clone.translate(source.translate());
  clone.center(source.center());
  clone.rotate(source.rotate());
  clone.angle(source.angle());
  return clone;
}

/** Full-world projection used only when there are no flights. */
export function createWorldProjection(
  dimensions: MapDimensions,
  padding: MapPadding = DEFAULT_PADDING
): GeoProjection {
  if (dimensions.width <= 0 || dimensions.height <= 0) {
    return createBaseProjection();
  }

  const projection = createWorldProjectionManual(dimensions, padding);
  return isProjectionValid(projection)
    ? projection
    : createBaseProjection().translate([
        dimensions.width / 2,
        dimensions.height / 2,
      ]);
}

/** Fit projection to the actual travel region for the given flights. */
export function createFlightMapProjection(
  flights: Flight[],
  dimensions: MapDimensions,
  padding: MapPadding = DEFAULT_PADDING
): GeoProjection {
  if (dimensions.width <= 0 || dimensions.height <= 0) {
    return createBaseProjection();
  }

  if (flights.length === 0) {
    return createWorldProjection(dimensions, padding);
  }

  const fitCoordinates = sanitizeCoordinates(collectFlightBoundsCoordinates(flights));
  if (fitCoordinates.length === 0) {
    return createWorldProjection(dimensions, padding);
  }

  const bounds = computeFlightGeoBounds(fitCoordinates);
  if (!bounds) {
    return createWorldProjection(dimensions, padding);
  }

  const projection = fitProjectionToCoordinates(
    fitCoordinates,
    dimensions,
    padding,
    [bounds.centerLng, bounds.centerLat]
  );

  return isProjectionValid(projection)
    ? projection
    : createWorldProjection(dimensions, padding);
}

function lerpNumber(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function lerpPair(
  from: [number, number],
  to: [number, number],
  t: number
): [number, number] {
  return [lerpNumber(from[0], to[0], t), lerpNumber(from[1], to[1], t)];
}

/** Interpolate longitude along the shortest arc. */
function lerpLongitude(from: number, to: number, t: number): number {
  let delta = to - from;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return from + delta * t;
}

function lerpRotate(
  from: [number, number, number],
  to: [number, number, number],
  t: number
): [number, number, number] {
  return [
    lerpLongitude(from[0], to[0], t),
    lerpNumber(from[1], to[1], t),
    lerpNumber(from[2], to[2], t),
  ];
}

function readProjectionState(projection: GeoProjection) {
  const translate = projection.translate();
  const center = projection.center();
  const rotate = projection.rotate();

  return {
    scale: Number.isFinite(projection.scale()) ? projection.scale() : 150,
    translate: [
      Number.isFinite(translate[0]) ? translate[0] : 0,
      Number.isFinite(translate[1]) ? translate[1] : 0,
    ] as [number, number],
    center: [
      Number.isFinite(center[0]) ? center[0] : 0,
      Number.isFinite(center[1]) ? center[1] : 0,
    ] as [number, number],
    rotate: [
      Number.isFinite(rotate[0]) ? rotate[0] : 0,
      Number.isFinite(rotate[1]) ? rotate[1] : 0,
      Number.isFinite(rotate[2]) ? rotate[2] : 0,
    ] as [number, number, number],
  };
}

/** Smoothly blend between two fitted projections (d3-geo has no built-in interpolate). */
export function createProjectionInterpolator(
  from: GeoProjection,
  to: GeoProjection
): (t: number) => GeoProjection {
  const start = readProjectionState(from);
  const end = readProjectionState(to);

  return (t: number) => {
    const projection = createBaseProjection();
    projection.scale(lerpNumber(start.scale, end.scale, t));
    projection.translate(lerpPair(start.translate, end.translate, t));
    projection.center([
      lerpLongitude(start.center[0], end.center[0], t),
      lerpNumber(start.center[1], end.center[1], t),
    ]);
    projection.rotate(lerpRotate(start.rotate, end.rotate, t));
    return projection;
  };
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function createCountryPathGenerator(projection: GeoProjection) {
  if (!isProjectionValid(projection)) {
    return () => "";
  }

  let path: ReturnType<typeof geoPath> | null = null;

  try {
    path = geoPath(projection);
  } catch {
    return () => "";
  }

  return (object: GeoPermissibleObjects) => {
    if (!path) return "";

    try {
      const result = path(object);
      return typeof result === "string" ? result : "";
    } catch {
      return "";
    }
  };
}

export function buildCountryPaths(
  countries: GeoPermissibleObjects[],
  projection: GeoProjection
): Array<{ key: string; d: string }> {
  if (!isProjectionValid(projection) || countries.length === 0) {
    return [];
  }

  const pathForFeature = createCountryPathGenerator(projection);
  const paths: Array<{ key: string; d: string }> = [];

  for (const feature of countries) {
    try {
      const d = pathForFeature(feature);
      if (!d) continue;

      const featureId = (feature as { id?: string | number }).id?.toString();
      paths.push({
        key: featureId ?? d.slice(0, 24),
        d,
      });
    } catch {
      // Skip malformed country geometries.
    }
  }

  return paths;
}

export function projectPoint(
  lng: number,
  lat: number,
  projection: GeoProjection
): [number, number] | null {
  const projected = projection([lng, lat]);
  if (
    !projected ||
    projected[0] === undefined ||
    projected[1] === undefined ||
    Number.isNaN(projected[0]) ||
    Number.isNaN(projected[1])
  ) {
    return null;
  }

  return [projected[0], projected[1]];
}

/** Stable key so projection only re-fits when flights or viewport meaningfully change. */
export function buildFlightBoundsKey(
  flights: Flight[],
  width: number,
  height: number
): string {
  const airportSignature = flights
    .flatMap((flight) => [
      `${flight.departureIata}:${flight.departureLat.toFixed(2)},${flight.departureLng.toFixed(2)}`,
      `${flight.arrivalIata}:${flight.arrivalLat.toFixed(2)},${flight.arrivalLng.toFixed(2)}`,
    ])
    .sort()
    .join("|");

  return `${width}x${height}|${airportSignature}`;
}

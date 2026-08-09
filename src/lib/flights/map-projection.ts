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

function boundsToFitFeature(
  coordinates: Array<[number, number]>,
  centerLng: number
) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "MultiPoint" as const,
      coordinates: coordinates.map(([lng, lat]) => [
        normalizeLongitudeRelativeToCenter(lng, centerLng),
        lat,
      ]),
    },
  };
}

function normalizeLongitudeRelativeToCenter(
  lng: number,
  centerLng: number
): number {
  let adjusted = lng;
  while (adjusted - centerLng > 180) adjusted -= 360;
  while (adjusted - centerLng < -180) adjusted += 360;
  return adjusted;
}

function createBaseProjection(): GeoProjection {
  return geoNaturalEarth1();
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
  const projection = createBaseProjection();
  const { width, height } = dimensions;

  if (width <= 0 || height <= 0) {
    return projection;
  }

  projection.fitExtent(
    [
      [padding.left, padding.top],
      [
        Math.max(padding.left + 1, width - padding.right),
        Math.max(padding.top + 1, height - padding.bottom),
      ],
    ],
    { type: "Sphere" }
  );

  return projection;
}

/** Fit projection to the actual travel region for the given flights. */
export function createFlightMapProjection(
  flights: Flight[],
  dimensions: MapDimensions,
  padding: MapPadding = DEFAULT_PADDING
): GeoProjection {
  const { width, height } = dimensions;

  if (width <= 0 || height <= 0) {
    return createBaseProjection();
  }

  const extent: [[number, number], [number, number]] = [
    [padding.left, padding.top],
    [
      Math.max(padding.left + 1, width - padding.right),
      Math.max(padding.top + 1, height - padding.bottom),
    ],
  ];

  if (flights.length === 0) {
    return createWorldProjection(dimensions, padding);
  }

  const bounds = computeFlightGeoBounds(collectFlightBoundsCoordinates(flights));
  if (!bounds) {
    return createWorldProjection(dimensions, padding);
  }

  const fitCoordinates = collectFlightBoundsCoordinates(flights);
  const projection = createBaseProjection();

  try {
    projection.center([bounds.centerLng, bounds.centerLat]);
    projection.fitExtent(
      extent,
      boundsToFitFeature(fitCoordinates, bounds.centerLng)
    );
  } catch (error) {
    console.error("[flights] Failed to fit map projection:", error);
    return createWorldProjection(dimensions, padding);
  }

  return projection;
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

/** Sample a great-circle path and project to SVG coordinates. */
export function buildProjectedRoutePoints(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  projection: GeoProjection,
  samples = 64
): Array<[number, number] | null> {
  const interpolate = geoInterpolate([startLng, startLat], [endLng, endLat]);
  const points: Array<[number, number] | null> = [];

  for (let index = 0; index <= samples; index += 1) {
    const [lng, lat] = interpolate(index / samples);
    const projected = projection([lng, lat]);

    if (
      projected === null ||
      projected[0] === undefined ||
      projected[1] === undefined ||
      Number.isNaN(projected[0]) ||
      Number.isNaN(projected[1])
    ) {
      points.push(null);
      continue;
    }

    points.push([projected[0], projected[1]]);
  }

  return points;
}

/** Convert projected points to a smooth SVG path (skips null gaps from antimeridian). */
export function pointsToSvgPath(points: Array<[number, number] | null>): string {
  const segments: string[] = [];
  let current: string[] = [];

  for (const point of points) {
    if (!point) {
      if (current.length) {
        segments.push(current.join(" "));
        current = [];
      }
      continue;
    }

    const [x, y] = point;
    current.push(current.length === 0 ? `M${x},${y}` : `L${x},${y}`);
  }

  if (current.length) {
    segments.push(current.join(" "));
  }

  return segments.join(" ");
}

export function buildRouteSvgPath(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  projection: GeoProjection
): string {
  const points = buildProjectedRoutePoints(
    startLng,
    startLat,
    endLng,
    endLat,
    projection
  );

  return pointsToSvgPath(points);
}

export function createCountryPathGenerator(projection: GeoProjection) {
  const path = geoPath(projection);

  return (object: GeoPermissibleObjects) => {
    try {
      return path(object) ?? "";
    } catch {
      return "";
    }
  };
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

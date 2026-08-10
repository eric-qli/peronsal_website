"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import {
  COUNTRIES_GEOJSON_URL,
  FLIGHT_MAP_COLORS,
  GLOBE_THEME,
  MAP_THEME,
} from "@/lib/flights/map-style";
import { computeInitialPointOfView } from "@/lib/flights/arc-layout";
import { computeRouteMidpoint } from "@/lib/flights/globe-arc-geometry";
import {
  flightsToAggregatedRoutePaths,
  flightsToGlobeAirports,
  flightsToIndividualFlightPaths,
  renderAggregatedRouteLabelHtml,
  renderAirportLabelHtml,
  renderFlightPathLabelHtml,
  type GlobeAirportDatum,
  type GlobePathDatum,
} from "@/lib/flights/globe-data";
import {
  groupFlightsByRoute,
  type FlightVisualizationMode,
} from "@/lib/flights/route-groups";
import { type Flight } from "@/lib/flights/types";

interface CountryFeatureCollection {
  features: Array<{
    properties?: Record<string, string | number | undefined>;
  }>;
}

interface FlightMapProps {
  flights: Flight[];
  mode: FlightVisualizationMode;
  selectedRouteKey: string | null;
  selectedFlightId: string | null;
  onSelectRoute: (routeKey: string) => void;
  onSelectFlight: (flight: Flight) => void;
}

function detectWebGLSupport(): boolean {
  if (typeof document === "undefined") return true;

  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

function asPath(obj: object): GlobePathDatum {
  return obj as GlobePathDatum;
}

function asAirport(obj: object): GlobeAirportDatum {
  return obj as GlobeAirportDatum;
}

export default function FlightMap({
  flights,
  mode,
  selectedRouteKey,
  selectedFlightId,
  onSelectRoute,
  onSelectFlight,
}: FlightMapProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [countries, setCountries] = useState<CountryFeatureCollection["features"]>(
    []
  );
  const [webglSupported] = useState(() => detectWebGLSupport());
  const [hoveredRouteKey, setHoveredRouteKey] = useState<string | null>(null);
  const [hoveredFlightId, setHoveredFlightId] = useState<string | null>(null);
  const hasSetInitialView = useRef(false);

  const airports = useMemo(() => flightsToGlobeAirports(flights), [flights]);
  const paths = useMemo(
    () =>
      mode === "routes"
        ? flightsToAggregatedRoutePaths(flights)
        : flightsToIndividualFlightPaths(flights),
    [flights, mode]
  );
  const routesByKey = useMemo(() => {
    const map = new Map(
      groupFlightsByRoute(flights).map((route) => [route.key, route])
    );
    return map;
  }, [flights]);

  const globeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: GLOBE_THEME.ocean,
        emissive: "#020608",
        shininess: 5,
      }),
    []
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setDimensions({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(COUNTRIES_GEOJSON_URL)
      .then((response) => response.json())
      .then((payload: CountryFeatureCollection) => {
        if (!cancelled) {
          setCountries(payload.features ?? []);
        }
      })
      .catch((error) => {
        console.error("[flights] Failed to load country polygons:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !dimensions.width || !dimensions.height) return;

    if (!hasSetInitialView.current) {
      hasSetInitialView.current = true;
      globe.pointOfView(computeInitialPointOfView(flights), 1200);
    }

    const controls = globe.controls();
    controls.enablePan = false;
    controls.minDistance = 160;
    controls.maxDistance = 520;
    controls.autoRotate = false;
  }, [dimensions.height, dimensions.width, flights]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !selectedRouteKey) return;

    const route = routesByKey.get(selectedRouteKey);
    if (!route) return;

    const mid = computeRouteMidpoint(route);
    globe.pointOfView({ lat: mid.lat, lng: mid.lng, altitude: 2.05 }, 900);
  }, [routesByKey, selectedRouteKey]);

  const getPathColor = useCallback(
    (obj: object) => {
      const path = asPath(obj);

      if (path.kind === "route") {
        const isSelected = path.routeKey === selectedRouteKey;
        const isHovered = path.routeKey === hoveredRouteKey;
        const isDimmed =
          (selectedRouteKey !== null || hoveredRouteKey !== null) &&
          !isSelected &&
          !isHovered;

        if (path.isGlow) {
          if (isDimmed) return FLIGHT_MAP_COLORS.routeGlowDimmed;
          if (isSelected) return FLIGHT_MAP_COLORS.routeGlowSelected;
          if (isHovered) return FLIGHT_MAP_COLORS.routeGlowHover;
          return `rgba(${FLIGHT_MAP_COLORS.routeGlowRgb}, ${path.style.glowOpacity})`;
        }

        if (isDimmed) return FLIGHT_MAP_COLORS.routeCoreDimmed;
        if (isSelected) return FLIGHT_MAP_COLORS.routeCoreSelected;
        if (isHovered) return FLIGHT_MAP_COLORS.routeCoreHover;
        return `rgba(${FLIGHT_MAP_COLORS.routeCoreRgb}, ${path.style.coreOpacity})`;
      }

      const flightId = path.flight?.id ?? null;
      const isSelected = flightId !== null && flightId === selectedFlightId;
      const isHovered = flightId !== null && flightId === hoveredFlightId;
      const isDimmed =
        (selectedFlightId !== null || hoveredFlightId !== null) &&
        !isSelected &&
        !isHovered;

      if (path.isGlow) {
        if (isDimmed) return FLIGHT_MAP_COLORS.routeGlowDimmed;
        if (isSelected) return FLIGHT_MAP_COLORS.routeGlowSelected;
        if (isHovered) return FLIGHT_MAP_COLORS.routeGlowHover;
        return `rgba(${FLIGHT_MAP_COLORS.routeGlowRgb}, 0.42)`;
      }

      if (isDimmed) return FLIGHT_MAP_COLORS.routeCoreDimmed;
      if (isSelected) return FLIGHT_MAP_COLORS.routeCoreSelected;
      if (isHovered) return FLIGHT_MAP_COLORS.routeCoreHover;
      return `rgba(${FLIGHT_MAP_COLORS.routeCoreRgb}, 0.94)`;
    },
    [hoveredFlightId, hoveredRouteKey, selectedFlightId, selectedRouteKey]
  );

  const getPathStroke = useCallback(
    (obj: object) => {
      const path = asPath(obj);

      if (path.kind === "route") {
        const isSelected = path.routeKey === selectedRouteKey;
        const isHovered = path.routeKey === hoveredRouteKey;

        if (path.isGlow) {
          if (isSelected) return path.style.glowStroke * 1.45;
          if (isHovered) return path.style.glowStroke * 1.3;
          return path.style.glowStroke;
        }

        if (isSelected) return path.style.stroke * 1.4;
        if (isHovered) return path.style.stroke * 1.3;
        return path.style.stroke;
      }

      const flightId = path.flight?.id ?? null;
      const isSelected = flightId !== null && flightId === selectedFlightId;
      const isHovered = flightId !== null && flightId === hoveredFlightId;

      if (path.isGlow) {
        if (isSelected) return 2.6;
        if (isHovered) return 2.35;
        return 1.95;
      }

      if (isSelected) return 1.25;
      if (isHovered) return 1.15;
      return 0.95;
    },
    [hoveredFlightId, hoveredRouteKey, selectedFlightId, selectedRouteKey]
  );

  if (!webglSupported) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#04080a] px-6 text-center">
        <p className="max-w-md text-sm text-[#94A3B8]">
          WebGL is not available in this browser, so the interactive flight globe
          cannot be displayed.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: MAP_THEME.background }}
    >
      {dimensions.width > 0 && dimensions.height > 0 ? (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(4, 8, 10, 0)"
          globeMaterial={globeMaterial}
          atmosphereColor="#5eead4"
          atmosphereAltitude={0.14}
          polygonsData={countries}
          polygonCapColor={() => GLOBE_THEME.land}
          polygonSideColor={() => "#0a1214"}
          polygonStrokeColor={() => GLOBE_THEME.border}
          polygonAltitude={0.004}
          arcsData={[]}
          pathsData={paths}
          pathPoints={(obj) => asPath(obj).points}
          pathPointLat={(point) => (point as { lat: number }).lat}
          pathPointLng={(point) => (point as { lng: number }).lng}
          pathPointAlt={(point) => (point as { alt: number }).alt}
          pathColor={getPathColor}
          pathStroke={getPathStroke}
          pathDashLength={(obj) => {
            const path = asPath(obj);
            if (path.isGlow) return 0;
            if (path.kind === "route") {
              return path.routeKey === selectedRouteKey ? 0.45 : 1;
            }
            return path.flight?.id === selectedFlightId ? 0.4 : 0.35;
          }}
          pathDashGap={(obj) => {
            const path = asPath(obj);
            if (path.isGlow) return 0;
            if (path.kind === "route") {
              return path.routeKey === selectedRouteKey ? 0.2 : 0;
            }
            return path.flight?.id === selectedFlightId ? 0.35 : 0.65;
          }}
          pathDashAnimateTime={(obj) => {
            const path = asPath(obj);
            if (path.isGlow) return 0;
            if (path.kind === "route") {
              return path.routeKey === selectedRouteKey ? 2800 : 0;
            }
            return path.flight?.id === selectedFlightId ? 2600 : 4500;
          }}
          pathLabel={(obj) => {
            const path = asPath(obj);
            if (path.kind === "route" && path.route) {
              return renderAggregatedRouteLabelHtml(path.route);
            }
            if (path.flight) {
              return renderFlightPathLabelHtml(path.flight);
            }
            return "";
          }}
          onPathClick={(path) => {
            if (!path) return;
            const datum = asPath(path);
            if (datum.kind === "route") {
              onSelectRoute(datum.routeKey);
              return;
            }
            if (datum.flight) {
              onSelectFlight(datum.flight);
            }
          }}
          onPathHover={(path) => {
            if (!path) {
              setHoveredRouteKey(null);
              setHoveredFlightId(null);
              return;
            }
            const datum = asPath(path);
            if (datum.kind === "route") {
              setHoveredRouteKey(datum.routeKey);
              setHoveredFlightId(null);
              return;
            }
            setHoveredFlightId(datum.flight?.id ?? null);
            setHoveredRouteKey(null);
          }}
          pointsData={airports}
          pointLat={(obj) => asAirport(obj).lat}
          pointLng={(obj) => asAirport(obj).lng}
          pointColor={() => FLIGHT_MAP_COLORS.airportCore}
          pointAltitude={0.012}
          pointRadius={0.26}
          pointLabel={(obj) => renderAirportLabelHtml(asAirport(obj))}
        />
      ) : null}
    </div>
  );
}

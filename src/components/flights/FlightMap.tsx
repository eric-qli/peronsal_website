"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { type GeoPermissibleObjects, type GeoProjection } from "d3-geo";
import {
  COUNTRIES_GEOJSON_URL,
  FLIGHT_MAP_COLORS,
  MAP_ROUTE_STYLES,
  MAP_THEME,
} from "@/lib/flights/map-style";
import {
  flightsToMapAirports,
  flightsToMapRoutes,
  type MapAirportDatum,
  type MapRouteDatum,
} from "@/lib/flights/map-data";
import {
  buildFlightBoundsKey,
  cloneProjection,
  createCountryPathGenerator,
  createFlightMapProjection,
  createProjectionInterpolator,
  createWorldProjection,
  easeInOutCubic,
  MAP_FIT_PADDING_PX,
} from "@/lib/flights/map-projection";
import { type Flight } from "@/lib/flights/types";
import {
  FlightAirportTooltip,
  FlightRouteTooltip,
} from "@/components/flights/FlightTooltip";

interface CountryFeatureCollection {
  features: GeoPermissibleObjects[];
}

interface FlightMapProps {
  flights: Flight[];
  selectedFlightId: string | null;
  onSelectFlight: (flight: Flight) => void;
}

interface TooltipState {
  kind: "route" | "airport";
  x: number;
  y: number;
  route?: MapRouteDatum;
  airport?: MapAirportDatum;
}

const INTRO_ANIMATION_MS = 1400;
const INTRO_STAGGER_MS = 90;
const MAP_FLY_DURATION_MS = 900;

function useContainerSize() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { containerRef, size };
}

const MAP_PADDING = {
  top: MAP_FIT_PADDING_PX,
  right: MAP_FIT_PADDING_PX,
  bottom: MAP_FIT_PADDING_PX,
  left: MAP_FIT_PADDING_PX,
};

function useAnimatedMapProjection(
  flights: Flight[],
  size: { width: number; height: number }
): GeoProjection | null {
  const [displayProjection, setDisplayProjection] = useState<GeoProjection | null>(
    null
  );
  const displayProjectionRef = useRef<GeoProjection | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const boundsKey = useMemo(
    () =>
      size.width > 0 && size.height > 0
        ? buildFlightBoundsKey(flights, size.width, size.height)
        : null,
    [flights, size.height, size.width]
  );

  useEffect(() => {
    displayProjectionRef.current = displayProjection;
  }, [displayProjection]);

  useEffect(() => {
    if (!boundsKey || size.width <= 0 || size.height <= 0) return;

    let targetProjection: GeoProjection;
    try {
      targetProjection = createFlightMapProjection(flights, size, MAP_PADDING);
    } catch (error) {
      console.error("[flights] Failed to create target projection:", error);
      targetProjection = createWorldProjection(size, MAP_PADDING);
    }

    const fromProjection =
      displayProjectionRef.current ?? createWorldProjection(size, MAP_PADDING);

    if (!displayProjectionRef.current) {
      const initial = cloneProjection(fromProjection);
      displayProjectionRef.current = initial;
      setDisplayProjection(initial);
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const interpolator = createProjectionInterpolator(fromProjection, targetProjection);
    const start = performance.now();

    const tick = (now: number) => {
      try {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / MAP_FLY_DURATION_MS);
        const eased = easeInOutCubic(progress);
        const nextProjection = interpolator(eased);
        const cloned = cloneProjection(nextProjection);
        displayProjectionRef.current = cloned;
        setDisplayProjection(cloned);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(tick);
        } else {
          animationFrameRef.current = null;
        }
      } catch (error) {
        console.error("[flights] Map projection animation failed:", error);
        const fallback = cloneProjection(targetProjection);
        displayProjectionRef.current = fallback;
        setDisplayProjection(fallback);
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [boundsKey, flights, size]);

  return displayProjection;
}

function AnimatedRoutePath({
  route,
  isSelected,
  isHovered,
  animate,
  animationDelayMs,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  route: MapRouteDatum;
  isSelected: boolean;
  isHovered: boolean;
  animate: boolean;
  animationDelayMs: number;
  onMouseEnter: (event: ReactMouseEvent<SVGPathElement>) => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  const glowRef = useRef<SVGPathElement>(null);
  const coreRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!animate) return;

    for (const element of [glowRef.current, coreRef.current]) {
      if (!element) continue;

      const length = element.getTotalLength();
      element.style.strokeDasharray = `${length}`;
      element.style.strokeDashoffset = `${length}`;
      element.style.transition = "none";

      requestAnimationFrame(() => {
        element.style.transition = `stroke-dashoffset ${INTRO_ANIMATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${animationDelayMs}ms`;
        element.style.strokeDashoffset = "0";
      });
    }
  }, [animate, animationDelayMs, route.path]);

  const glowColor = isSelected
    ? FLIGHT_MAP_COLORS.routeGlowSelected
    : isHovered
      ? FLIGHT_MAP_COLORS.routeGlowHover
      : FLIGHT_MAP_COLORS.routeGlow;
  const coreColor = isSelected
    ? FLIGHT_MAP_COLORS.routeCoreSelected
    : isHovered
      ? FLIGHT_MAP_COLORS.routeCoreHover
      : FLIGHT_MAP_COLORS.routeCore;
  const glowWidth = isSelected || isHovered
    ? MAP_ROUTE_STYLES.glowWidthHover
    : MAP_ROUTE_STYLES.glowWidth;
  const coreWidth = isSelected
    ? MAP_ROUTE_STYLES.coreWidthSelected
    : isHovered
      ? MAP_ROUTE_STYLES.coreWidthHover
      : MAP_ROUTE_STYLES.coreWidth;

  return (
    <g
      className="cursor-pointer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <path
        ref={glowRef}
        d={route.path}
        fill="none"
        stroke={glowColor}
        strokeWidth={glowWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
        style={{ strokeDashoffset: animate ? undefined : 0 }}
      />
      <path
        ref={coreRef}
        d={route.path}
        fill="none"
        stroke={coreColor}
        strokeWidth={coreWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
        style={{ strokeDashoffset: animate ? undefined : 0 }}
      />
      <path
        d={route.path}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        strokeLinecap="round"
        pointerEvents="stroke"
      />
    </g>
  );
}

export default function FlightMap({
  flights,
  selectedFlightId,
  onSelectFlight,
}: FlightMapProps) {
  const { containerRef, size } = useContainerSize();
  const projection = useAnimatedMapProjection(flights, size);
  const [countries, setCountries] = useState<GeoPermissibleObjects[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [hoveredAirportIata, setHoveredAirportIata] = useState<string | null>(
    null
  );
  const [introAnimationComplete, setIntroAnimationComplete] = useState(false);

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
    if (introAnimationComplete || flights.length === 0) return;

    const timer = window.setTimeout(() => {
      setIntroAnimationComplete(true);
    }, INTRO_ANIMATION_MS + flights.length * INTRO_STAGGER_MS + 200);

    return () => window.clearTimeout(timer);
  }, [flights.length, introAnimationComplete]);

  const countryPaths = useMemo(() => {
    if (!projection || !size.width || !size.height || !countries.length) {
      return [];
    }

    const pathForFeature = createCountryPathGenerator(projection);
    return countries
      .map((feature) => {
        const d = pathForFeature(feature);
        const featureId = (feature as { id?: string | number }).id?.toString();
        return {
          key: featureId ?? (d || Math.random().toString()),
          d,
        };
      })
      .filter((entry) => entry.d.length > 0);
  }, [countries, projection, size.height, size.width]);

  const routes = useMemo(
    () =>
      projection && size.width && size.height
        ? flightsToMapRoutes(flights, projection)
        : [],
    [flights, projection, size.height, size.width]
  );

  const airports = useMemo(
    () =>
      projection && size.width && size.height
        ? flightsToMapAirports(flights, projection)
        : [],
    [flights, projection, size.height, size.width]
  );

  const updateTooltipPosition = useCallback(
    (event: ReactMouseEvent, next: Omit<TooltipState, "x" | "y">) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setTooltip({
        ...next,
        x: event.clientX - rect.left + 14,
        y: event.clientY - rect.top + 14,
      });
    },
    [containerRef]
  );

  const handleRouteMouseEnter = useCallback(
    (route: MapRouteDatum, event: ReactMouseEvent<SVGPathElement>) => {
      setHoveredRouteId(route.id);
      updateTooltipPosition(event, { kind: "route", route });
    },
    [updateTooltipPosition]
  );

  const handleAirportMouseEnter = useCallback(
    (airport: MapAirportDatum, event: ReactMouseEvent<SVGElement>) => {
      setHoveredAirportIata(airport.iata);
      updateTooltipPosition(event, { kind: "airport", airport });
    },
    [updateTooltipPosition]
  );

  const clearHover = useCallback(() => {
    setHoveredRouteId(null);
    setHoveredAirportIata(null);
    setTooltip(null);
  }, []);

  const playIntroAnimation = !introAnimationComplete && flights.length > 0;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: MAP_THEME.background }}
      onMouseLeave={clearHover}
    >
      {projection && size.width > 0 && size.height > 0 ? (
        <svg
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          className="h-full w-full"
          role="img"
          aria-label="Personal flight route map"
        >
          <defs>
            <filter id="airport-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill={MAP_THEME.ocean}
          />

          <g>
            {countryPaths.map((country) => (
              <path
                key={country.key}
                d={country.d}
                fill={MAP_THEME.land}
                stroke={MAP_THEME.borderSubtle}
                strokeWidth={0.6}
              />
            ))}
          </g>

          <g>
            {routes.map((route, index) => (
              <AnimatedRoutePath
                key={route.id}
                route={route}
                isSelected={route.id === selectedFlightId}
                isHovered={route.id === hoveredRouteId}
                animate={playIntroAnimation}
                animationDelayMs={index * INTRO_STAGGER_MS}
                onMouseEnter={(event) => handleRouteMouseEnter(route, event)}
                onMouseLeave={clearHover}
                onClick={() => onSelectFlight(route.flight)}
              />
            ))}
          </g>

          <g filter="url(#airport-glow)">
            {airports.map((airport) => {
              const isHovered = airport.iata === hoveredAirportIata;

              return (
                <g
                  key={airport.iata}
                  className="cursor-default"
                  onMouseEnter={(event) => handleAirportMouseEnter(airport, event)}
                  onMouseLeave={clearHover}
                >
                  <circle
                    cx={airport.x}
                    cy={airport.y}
                    r={
                      isHovered
                        ? MAP_ROUTE_STYLES.airportHaloRadiusHover
                        : MAP_ROUTE_STYLES.airportHaloRadius
                    }
                    fill={
                      isHovered
                        ? FLIGHT_MAP_COLORS.airportHaloHover
                        : FLIGHT_MAP_COLORS.airportHalo
                    }
                  />
                  <circle
                    cx={airport.x}
                    cy={airport.y}
                    r={MAP_ROUTE_STYLES.airportCoreRadius}
                    fill={FLIGHT_MAP_COLORS.airportCore}
                  />
                </g>
              );
            })}
          </g>
        </svg>
      ) : null}

      {tooltip ? (
        <div
          className="pointer-events-none absolute z-20"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.kind === "route" && tooltip.route ? (
            <FlightRouteTooltip flight={tooltip.route.flight} />
          ) : null}
          {tooltip.kind === "airport" && tooltip.airport ? (
            <FlightAirportTooltip
              iata={tooltip.airport.iata}
              name={tooltip.airport.name}
              visitCount={tooltip.airport.visitCount}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

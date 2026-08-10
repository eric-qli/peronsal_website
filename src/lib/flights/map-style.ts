export const MAP_THEME = {
  background: "#04080a",
  ocean: "#04080a",
  land: "#1a3338",
  landHighlight: "#234248",
  border: "rgba(94, 234, 212, 0.22)",
  borderSubtle: "rgba(56, 189, 248, 0.12)",
  borderAccent: "rgba(248, 113, 113, 0.18)",
  vignette: "rgba(4, 8, 10, 0.85)",
} as const;

/** Bright cyan/aqua route palette — high contrast vs dark teal land. */
export const FLIGHT_MAP_COLORS = {
  background: MAP_THEME.background,
  countryFill: MAP_THEME.land,
  countryBorder: MAP_THEME.border,
  /** Core line RGB (bright aqua). */
  routeCoreRgb: "103, 232, 249",
  routeCore: "rgba(103, 232, 249, 0.92)",
  routeCoreHover: "rgba(165, 243, 252, 1)",
  routeCoreSelected: "rgba(224, 251, 255, 1)",
  routeCoreDimmed: "rgba(103, 232, 249, 0.28)",
  /** Outer glow RGB (softer teal). */
  routeGlowRgb: "34, 211, 238",
  routeGlow: "rgba(34, 211, 238, 0.38)",
  routeGlowHover: "rgba(34, 211, 238, 0.55)",
  routeGlowSelected: "rgba(103, 232, 249, 0.62)",
  routeGlowDimmed: "rgba(34, 211, 238, 0.1)",
  airportCore: "rgba(236, 254, 255, 1)",
  airportHalo: "rgba(34, 211, 238, 0.55)",
  airportHaloHover: "rgba(103, 232, 249, 0.7)",
} as const;

export const GLOBE_THEME = {
  background: MAP_THEME.background,
  ocean: MAP_THEME.ocean,
  land: MAP_THEME.land,
  landSide: "#0a1214",
  border: "rgba(94, 234, 212, 0.1)",
  atmosphere: "#5eead4",
  atmosphereAltitude: 0.14,
} as const;

export const COUNTRIES_GEOJSON_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

export const MAP_ROUTE_STYLES = {
  coreWidth: 1,
  coreWidthHover: 1.45,
  coreWidthSelected: 1.6,
  glowWidth: 2.6,
  glowWidthHover: 3.6,
  airportCoreRadius: 2.2,
  airportHaloRadius: 4.5,
  airportHaloRadiusHover: 6,
} as const;

/** Bottom inset reserved for the stats card overlay. */
export const MAP_STATS_CARD_INSET_PX = 148;

/** Uniform map fit padding on top and sides. */
export const MAP_FIT_PADDING_PX = 100;

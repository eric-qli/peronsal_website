export const MAP_THEME = {
  background: "#06080d",
  ocean: "#06080d",
  land: "#131820",
  landHighlight: "#171d27",
  border: "rgba(55, 65, 81, 0.55)",
  borderSubtle: "rgba(45, 55, 72, 0.35)",
} as const;

export const FLIGHT_MAP_COLORS = {
  background: MAP_THEME.background,
  countryFill: MAP_THEME.land,
  countryBorder: MAP_THEME.border,
  routeCore: "rgba(125, 211, 252, 0.88)",
  routeCoreHover: "rgba(186, 230, 253, 1)",
  routeCoreSelected: "rgba(224, 242, 254, 1)",
  routeGlow: "rgba(56, 189, 248, 0.22)",
  routeGlowHover: "rgba(125, 211, 252, 0.38)",
  routeGlowSelected: "rgba(125, 211, 252, 0.48)",
  airportCore: "rgba(248, 250, 252, 0.95)",
  airportHalo: "rgba(148, 163, 184, 0.28)",
  airportHaloHover: "rgba(186, 230, 253, 0.42)",
} as const;

/** @deprecated Globe-only theme; flat map uses MAP_THEME. */
export const GLOBE_THEME = {
  background: MAP_THEME.background,
  ocean: MAP_THEME.ocean,
  land: MAP_THEME.land,
  landSide: "#0a0e14",
  border: "#29313d",
  atmosphere: "#6b7f99",
  atmosphereAltitude: 0.18,
} as const;

export const COUNTRIES_GEOJSON_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

export const MAP_ROUTE_STYLES = {
  coreWidth: 1.35,
  coreWidthHover: 1.85,
  coreWidthSelected: 2,
  glowWidth: 4.5,
  glowWidthHover: 5.5,
  airportCoreRadius: 2.2,
  airportHaloRadius: 6,
  airportHaloRadiusHover: 7.5,
} as const;

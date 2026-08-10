/**
 * Canonical airport location normalization.
 *
 * Provider data may supply ISO codes ("CA") while the static airport
 * catalog uses English names ("Canada"). All grouping/counting uses
 * countryCode; all UI display uses countryName.
 */

export interface NormalizedCountry {
  countryCode: string | null;
  countryName: string;
}

export interface NormalizedCity {
  city: string;
  cityKey: string;
  countryCode: string | null;
  countryName: string;
}

export interface NormalizedAirportLocation {
  airportCode: string;
  name: string;
  city: string;
  countryName: string;
  countryCode: string | null;
  latitude?: number;
  longitude?: number;
}

const regionDisplayNames =
  typeof Intl !== "undefined"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

/**
 * Prefer short, traveler-friendly English names over some Intl labels
 * (e.g. "Hong Kong" instead of "Hong Kong SAR China").
 */
const COUNTRY_DISPLAY_OVERRIDES: Record<string, string> = {
  HK: "Hong Kong",
  MO: "Macau",
  TW: "Taiwan",
  KR: "South Korea",
  KP: "North Korea",
  RU: "Russia",
  VN: "Vietnam",
  CZ: "Czech Republic",
  US: "United States",
  GB: "United Kingdom",
};

/** Common aliases that are not exact Intl region display names. */
const COUNTRY_NAME_ALIASES: Record<string, string> = {
  usa: "US",
  "u.s.": "US",
  "u.s.a.": "US",
  "united states of america": "US",
  america: "US",
  uk: "GB",
  "great britain": "GB",
  britain: "GB",
  england: "GB",
  "south korea": "KR",
  korea: "KR",
  "republic of korea": "KR",
  "north korea": "KP",
  russia: "RU",
  "russian federation": "RU",
  vietnam: "VN",
  "viet nam": "VN",
  czechia: "CZ",
  "czech republic": "CZ",
  holland: "NL",
  "the netherlands": "NL",
  iran: "IR",
  syria: "SY",
  bolivia: "BO",
  venezuela: "VE",
  tanzania: "TZ",
  laos: "LA",
  brunei: "BN",
  taiwan: "TW",
  "hong kong": "HK",
  "hong kong sar": "HK",
  "hong kong sar china": "HK",
  "hong kong china": "HK",
  macau: "MO",
  macao: "MO",
  palestine: "PS",
  "ivory coast": "CI",
  "cote divoire": "CI",
  "côte d'ivoire": "CI",
  swaziland: "SZ",
  eswatini: "SZ",
  burma: "MM",
  myanmar: "MM",
};

/** Reject pseudo-region codes that Intl may accept but are not ISO alpha-2 countries we want. */
const INVALID_REGION_CODES = new Set(["UK", "EU", "ZZ"]);

let nameToCodeCache: Map<string, string> | null = null;

function getNameToCodeMap(): Map<string, string> {
  if (nameToCodeCache) return nameToCodeCache;

  const map = new Map<string, string>();

  if (regionDisplayNames) {
    for (let a = 65; a <= 90; a += 1) {
      for (let b = 65; b <= 90; b += 1) {
        const code = String.fromCharCode(a, b);
        if (INVALID_REGION_CODES.has(code)) continue;
        const name = regionDisplayNames.of(code);
        if (!name || name === code) continue;
        const key = name.toLowerCase();
        // Do not let later pseudo-codes overwrite a real ISO mapping.
        if (!map.has(key)) {
          map.set(key, code);
        }
      }
    }
  }

  for (const [alias, code] of Object.entries(COUNTRY_NAME_ALIASES)) {
    map.set(alias, code);
  }

  for (const [code, displayName] of Object.entries(COUNTRY_DISPLAY_OVERRIDES)) {
    map.set(displayName.toLowerCase(), code);
  }

  nameToCodeCache = map;
  return map;
}

function titleCaseWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 2 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function countryNameFromCode(code: string): string {
  const upper = code.toUpperCase();
  if (COUNTRY_DISPLAY_OVERRIDES[upper]) {
    return COUNTRY_DISPLAY_OVERRIDES[upper];
  }
  const name = regionDisplayNames?.of(upper);
  if (name && name !== upper) return name;
  return upper;
}

/**
 * Resolve any country input (ISO code or display name) to a canonical pair.
 * Aggregation must use `countryCode`; UI must use `countryName`.
 */
export function normalizeCountry(
  value: string | null | undefined,
  explicitCode?: string | null
): NormalizedCountry | null {
  const codeHint = explicitCode?.trim().toUpperCase() ?? "";
  if (/^[A-Z]{2}$/.test(codeHint)) {
    return {
      countryCode: codeHint,
      countryName: countryNameFromCode(codeHint),
    };
  }

  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const code = trimmed.toUpperCase();
    if (INVALID_REGION_CODES.has(code)) {
      // e.g. "UK" → GB / United Kingdom
      const aliased = COUNTRY_NAME_ALIASES[code.toLowerCase()];
      if (aliased) {
        return {
          countryCode: aliased,
          countryName: countryNameFromCode(aliased),
        };
      }
    }
    return {
      countryCode: code,
      countryName: countryNameFromCode(code),
    };
  }

  const lower = trimmed.toLowerCase().replace(/\./g, "");
  const aliased = COUNTRY_NAME_ALIASES[trimmed.toLowerCase()] ?? COUNTRY_NAME_ALIASES[lower];
  if (aliased) {
    return {
      countryCode: aliased,
      countryName: countryNameFromCode(aliased),
    };
  }

  const fromName = getNameToCodeMap().get(trimmed.toLowerCase());
  if (fromName) {
    return {
      countryCode: fromName,
      countryName: countryNameFromCode(fromName),
    };
  }

  // Unknown free-form label — keep displayable name, no ISO code.
  return {
    countryCode: null,
    countryName: titleCaseWords(trimmed),
  };
}

/** Canonical city display name (trimmed / spaced). */
export function normalizeCityName(city: string | null | undefined): string {
  if (!city) return "";
  return city.trim().replace(/\s+/g, " ");
}

/**
 * City aggregation key: `cityLower|countryCode`.
 * Falls back to `cityLower|name:countryName` when no ISO code exists.
 */
export function getCityAggregationKey(
  city: string,
  country: NormalizedCountry | null
): string {
  const cityPart = (city || "unknown").trim().toLowerCase();
  if (country?.countryCode) {
    return `${cityPart}|${country.countryCode}`;
  }
  if (country?.countryName) {
    return `${cityPart}|name:${country.countryName.toLowerCase()}`;
  }
  return `${cityPart}|unknown`;
}

export function normalizeCity(
  city: string | null | undefined,
  countryValue: string | null | undefined,
  explicitCountryCode?: string | null,
  fallbackLabel?: string | null
): NormalizedCity {
  const country = normalizeCountry(countryValue, explicitCountryCode);
  const normalizedCity =
    normalizeCityName(city) ||
    normalizeCityName(fallbackLabel) ||
    "Unknown";

  return {
    city: normalizedCity,
    cityKey: getCityAggregationKey(normalizedCity, country),
    countryCode: country?.countryCode ?? null,
    countryName: country?.countryName ?? "Unknown",
  };
}

export function normalizeAirport(input: {
  airportCode: string;
  name?: string | null;
  city?: string | null;
  country?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  latitude?: number;
  longitude?: number;
}): NormalizedAirportLocation {
  const airportCode = input.airportCode.trim().toUpperCase();
  const country = normalizeCountry(
    input.countryName ?? input.country,
    input.countryCode
  );
  const city = normalizeCityName(input.city) || airportCode;

  return {
    airportCode,
    name: input.name?.trim() || airportCode,
    city,
    countryName: country?.countryName ?? "",
    countryCode: country?.countryCode ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
  };
}

/** Country aggregation key — prefers ISO code. */
export function getCountryAggregationKey(
  country: NormalizedCountry | null
): string | null {
  if (!country) return null;
  if (country.countryCode) return country.countryCode;
  if (country.countryName) return `name:${country.countryName.toLowerCase()}`;
  return null;
}

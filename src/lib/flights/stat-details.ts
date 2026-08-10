import { calculateDistanceKm } from "@/lib/flights/distance";
import {
  getCityAggregationKey,
  getCountryAggregationKey,
  normalizeCity,
  normalizeCountry,
} from "@/lib/flights/location-normalize";
import { type Flight } from "@/lib/flights/types";

export type StatPanel = "distance" | "flights" | "countries" | "cities";

export interface FlightDistanceRow {
  flight: Flight;
  distanceKm: number;
  rank: number;
}

export interface FlightHistoryRow {
  flight: Flight;
  distanceKm: number | null;
}

export interface CountryStatRow {
  /** ISO country code (or name: fallback) used for aggregation. */
  key: string;
  countryCode: string | null;
  countryName: string;
  internationalArrivals: number;
}

export interface CityStatRow {
  key: string;
  cityName: string;
  countryCode: string | null;
  countryName: string | null;
  visitCount: number;
  rank: number;
}

function countryFromFlightSide(
  countryName: string | null,
  countryCode: string | null
) {
  return normalizeCountry(countryName, countryCode);
}

/** Prefer stored distance; fall back to great-circle from coordinates. */
export function getFlightDistanceKm(flight: Flight): number {
  if (flight.distanceKm !== null && !Number.isNaN(flight.distanceKm)) {
    return flight.distanceKm;
  }

  return calculateDistanceKm(
    flight.departureLat,
    flight.departureLng,
    flight.arrivalLat,
    flight.arrivalLng
  );
}

/**
 * International when origin and destination ISO country codes differ.
 */
export function isInternationalFlight(flight: Flight): boolean {
  const origin = countryFromFlightSide(
    flight.departureCountry,
    flight.departureCountryCode
  );
  const destination = countryFromFlightSide(
    flight.arrivalCountry,
    flight.arrivalCountryCode
  );

  const originKey = getCountryAggregationKey(origin);
  const destinationKey = getCountryAggregationKey(destination);
  if (!originKey || !destinationKey) return false;
  return originKey !== destinationKey;
}

/** All flights sorted farthest → shortest. */
export function getFlightsByDistance(flights: Flight[]): FlightDistanceRow[] {
  const sorted = [...flights].sort(
    (a, b) => getFlightDistanceKm(b) - getFlightDistanceKm(a)
  );

  return sorted.map((flight, index) => ({
    flight,
    distanceKm: getFlightDistanceKm(flight),
    rank: index + 1,
  }));
}

/**
 * Travel chronology: most recent → oldest by departureDate.
 * Falls back to createdAt only when departureDate is missing/invalid.
 */
export function getFlightsByDate(flights: Flight[]): FlightHistoryRow[] {
  const sorted = [...flights].sort((a, b) => {
    const aTime = getFlightChronologyTime(a);
    const bTime = getFlightChronologyTime(b);
    return bTime - aTime;
  });

  return sorted.map((flight) => ({
    flight,
    distanceKm:
      flight.distanceKm !== null && !Number.isNaN(flight.distanceKm)
        ? flight.distanceKm
        : getFlightDistanceKm(flight),
  }));
}

function getFlightChronologyTime(flight: Flight): number {
  if (flight.departureDate) {
    const parsed = Date.parse(`${flight.departureDate}T00:00:00`);
    if (!Number.isNaN(parsed)) return parsed;
  }

  const created = Date.parse(flight.createdAt);
  return Number.isNaN(created) ? 0 : created;
}

/**
 * Countries that appear in travel history (dep or arr), A→Z by name.
 * Grouped by countryCode. Arrival counts only for international inbound.
 */
export function getCountryStats(flights: Flight[]): CountryStatRow[] {
  const byKey = new Map<
    string,
    {
      countryCode: string | null;
      countryName: string;
      internationalArrivals: number;
    }
  >();

  function touchCountry(
    countryName: string | null,
    countryCode: string | null
  ) {
    const country = countryFromFlightSide(countryName, countryCode);
    const key = getCountryAggregationKey(country);
    if (!key || !country) return;

    if (!byKey.has(key)) {
      byKey.set(key, {
        countryCode: country.countryCode,
        countryName: country.countryName,
        internationalArrivals: 0,
      });
    }
  }

  for (const flight of flights) {
    touchCountry(flight.departureCountry, flight.departureCountryCode);
    touchCountry(flight.arrivalCountry, flight.arrivalCountryCode);

    if (!isInternationalFlight(flight)) continue;

    const arrival = countryFromFlightSide(
      flight.arrivalCountry,
      flight.arrivalCountryCode
    );
    const arrivalKey = getCountryAggregationKey(arrival);
    if (!arrivalKey) continue;

    const row = byKey.get(arrivalKey);
    if (row) {
      row.internationalArrivals += 1;
    }
  }

  return [...byKey.entries()]
    .map(([key, row]) => ({
      key,
      countryCode: row.countryCode,
      countryName: row.countryName,
      internationalArrivals: row.internationalArrivals,
    }))
    .sort((a, b) => a.countryName.localeCompare(b.countryName));
}

/**
 * City visits from arrival airports only (domestic + international).
 * Keyed by `cityLower|countryCode`. Sorted most visited → least.
 */
export function getCityStats(flights: Flight[]): CityStatRow[] {
  const byKey = new Map<
    string,
    {
      cityName: string;
      countryCode: string | null;
      countryName: string | null;
      visitCount: number;
    }
  >();

  for (const flight of flights) {
    const city = normalizeCity(
      flight.arrivalCity,
      flight.arrivalCountry,
      flight.arrivalCountryCode,
      flight.arrivalIata
    );

    const key =
      city.cityKey ||
      getCityAggregationKey(city.city, {
        countryCode: city.countryCode,
        countryName: city.countryName,
      });

    const existing = byKey.get(key);
    if (existing) {
      existing.visitCount += 1;
      continue;
    }

    byKey.set(key, {
      cityName: city.city,
      countryCode: city.countryCode,
      countryName: city.countryName,
      visitCount: 1,
    });
  }

  return [...byKey.entries()]
    .map(([key, row]) => ({ key, ...row }))
    .sort((a, b) => {
      if (b.visitCount !== a.visitCount) {
        return b.visitCount - a.visitCount;
      }
      return a.cityName.localeCompare(b.cityName);
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

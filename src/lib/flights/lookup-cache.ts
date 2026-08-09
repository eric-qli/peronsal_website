import "server-only";

import { type FlightLookupResult } from "@/lib/flights/providers/types";

const CACHE_TTL_MS = 15 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  results: FlightLookupResult[];
}

const lookupCache = new Map<string, CacheEntry>();

function buildCacheKey(flightNumber: string, date: string): string {
  return `${flightNumber}:${date}`;
}

export function getCachedLookupResults(
  flightNumber: string,
  date: string
): FlightLookupResult[] | null {
  const key = buildCacheKey(flightNumber, date);
  const entry = lookupCache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    lookupCache.delete(key);
    return null;
  }

  return entry.results;
}

export function setCachedLookupResults(
  flightNumber: string,
  date: string,
  results: FlightLookupResult[]
): void {
  if (results.length === 0) {
    return;
  }

  lookupCache.set(buildCacheKey(flightNumber, date), {
    expiresAt: Date.now() + CACHE_TTL_MS,
    results,
  });
}

import "server-only";

import { getAirportByIata } from "@/lib/flights/airports";
import { calculateDistanceKm } from "@/lib/flights/distance";
import { normalizeCountry } from "@/lib/flights/location-normalize";
import {
  type AirportLookupData,
  type FlightLookupRequest,
  type FlightLookupResult,
  FlightProviderError,
  type FlightDataProvider,
} from "@/lib/flights/providers/types";

const REQUEST_TIMEOUT_MS = 15_000;

interface AeroDateTime {
  utc?: string | null;
  local?: string | null;
}

interface AeroGeo {
  lat?: number | null;
  lon?: number | null;
}

interface AeroAirport {
  iata?: string | null;
  icao?: string | null;
  name?: string | null;
  municipalityName?: string | null;
  countryCode?: string | null;
  timeZone?: string | null;
  location?: AeroGeo | null;
}

interface AeroMovement {
  airport?: AeroAirport | null;
  scheduledTime?: AeroDateTime | null;
  revisedTime?: AeroDateTime | null;
  terminal?: string | null;
  gate?: string | null;
}

interface AeroAircraft {
  reg?: string | null;
  model?: string | null;
  modeS?: string | null;
}

interface AeroAirline {
  name?: string | null;
  iata?: string | null;
  icao?: string | null;
}

interface AeroFlight {
  number?: string | null;
  callSign?: string | null;
  status?: string | null;
  codeshareStatus?: string | null;
  departure?: AeroMovement | null;
  arrival?: AeroMovement | null;
  aircraft?: AeroAircraft | null;
  airline?: AeroAirline | null;
  greatCircleDistance?: {
    km?: number | null;
  } | null;
  lastUpdatedUtc?: string | null;
}

function getConfig() {
  const apiKey = process.env.AERODATABOX_API_KEY?.trim();
  const baseUrl =
    process.env.AERODATABOX_API_BASE_URL?.trim() ??
    "https://aerodatabox.p.rapidapi.com";
  const apiHost =
    process.env.AERODATABOX_API_HOST?.trim() ?? "aerodatabox.p.rapidapi.com";

  if (!apiKey) {
    throw new FlightProviderError(
      "Flight lookup is not configured. Add AERODATABOX_API_KEY to .env.local and restart the dev server.",
      "CONFIGURATION"
    );
  }

  return { apiKey, baseUrl, apiHost };
}

function countryFromProviderCode(code: string | null | undefined): {
  country: string;
  countryCode: string | null;
} {
  const normalized = normalizeCountry(null, code);
  if (!normalized) {
    return { country: "", countryCode: null };
  }
  return {
    country: normalized.countryName,
    countryCode: normalized.countryCode,
  };
}

function toIsoTimestamp(value: AeroDateTime | null | undefined): string | null {
  if (!value) return null;
  return value.utc ?? value.local ?? null;
}

function mapAirportFromMovement(
  movement: AeroMovement | null | undefined
): Omit<AirportLookupData, "latitude" | "longitude"> & {
  latitude?: number;
  longitude?: number;
} | null {
  const airport = movement?.airport;
  if (!airport?.iata) {
    return null;
  }

  const latitude = airport.location?.lat ?? undefined;
  const longitude = airport.location?.lon ?? undefined;
  const country = countryFromProviderCode(airport.countryCode);

  return {
    iata: airport.iata.toUpperCase(),
    icao: airport.icao?.toUpperCase() ?? null,
    name: airport.name ?? airport.iata,
    city: airport.municipalityName ?? "",
    country: country.country,
    countryCode: country.countryCode,
    latitude,
    longitude,
    timezone: airport.timeZone ?? null,
  };
}

async function enrichAirport(
  partial: ReturnType<typeof mapAirportFromMovement>
): Promise<AirportLookupData | null> {
  if (!partial) {
    return null;
  }

  if (
    partial.latitude !== undefined &&
    partial.longitude !== undefined
  ) {
    return {
      iata: partial.iata,
      icao: partial.icao,
      name: partial.name,
      city: partial.city,
      country: partial.country,
      countryCode: partial.countryCode,
      latitude: partial.latitude,
      longitude: partial.longitude,
      timezone: partial.timezone,
    };
  }

  const local = getAirportByIata(partial.iata);
  if (!local) {
    return null;
  }

  return {
    iata: local.iata,
    name: partial.name || local.name,
    city: partial.city || local.city,
    country: partial.country || local.country,
    countryCode: partial.countryCode || local.countryCode,
    latitude: local.latitude,
    longitude: local.longitude,
    timezone: partial.timezone,
  };
}

function mapFlightBase(
  raw: AeroFlight,
  request: FlightLookupRequest,
  departure: AirportLookupData,
  arrival: AirportLookupData
): FlightLookupResult | null {
  const scheduledDepartureAt =
    raw.departure?.scheduledTime?.local ??
    raw.departure?.scheduledTime?.utc ??
    null;

  if (!scheduledDepartureAt) {
    return null;
  }

  const scheduledArrivalAt = toIsoTimestamp(raw.arrival?.scheduledTime);
  const actualDepartureAt = toIsoTimestamp(raw.departure?.revisedTime);
  const actualArrivalAt = toIsoTimestamp(raw.arrival?.revisedTime);

  const distanceKm =
    raw.greatCircleDistance?.km ??
    calculateDistanceKm(
      departure.latitude,
      departure.longitude,
      arrival.latitude,
      arrival.longitude
    );

  return {
    providerId: `${raw.number ?? request.flightNumber}-${scheduledDepartureAt}`,
    marketingFlightNumber: raw.number ?? request.flightNumber,
    operatingFlightNumber: raw.callSign ?? raw.number ?? request.flightNumber,
    airlineName: raw.airline?.name ?? "Unknown airline",
    airlineIata: raw.airline?.iata?.toUpperCase() ?? null,
    codeshareStatus: raw.codeshareStatus ?? null,
    departure,
    arrival,
    scheduledDepartureAt,
    scheduledArrivalAt,
    actualDepartureAt,
    actualArrivalAt,
    aircraftModel: raw.aircraft?.model ?? null,
    aircraftTypeCode: raw.aircraft?.modeS ?? null,
    aircraftRegistration: raw.aircraft?.reg ?? null,
    departureTerminal: raw.departure?.terminal ?? null,
    departureGate: raw.departure?.gate ?? null,
    arrivalTerminal: raw.arrival?.terminal ?? null,
    arrivalGate: raw.arrival?.gate ?? null,
    status: raw.status ?? null,
    distanceKm,
    source: "aerodatabox",
  };
}

async function fetchAeroDataBox<T>(
  path: string,
  query?: Record<string, string>
): Promise<T> {
  const { apiKey, baseUrl, apiHost } = getConfig();
  const url = new URL(`${baseUrl}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": apiHost,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new FlightProviderError(
        "The flight-data service timed out.",
        "TIMEOUT"
      );
    }

    throw new FlightProviderError(
      "The flight-data service is temporarily unavailable.",
      "PROVIDER_UNAVAILABLE"
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new FlightProviderError(
      "Flight lookup authentication failed.",
      "AUTH_ERROR"
    );
  }

  if (response.status === 429) {
    throw new FlightProviderError(
      "Flight lookup quota exceeded.",
      "QUOTA_EXCEEDED"
    );
  }

  if (response.status === 400) {
    throw new FlightProviderError(
      "The flight number or date is invalid for lookup.",
      "INVALID_FLIGHT_NUMBER"
    );
  }

  if (response.status === 204 || response.status === 404) {
    return [] as T;
  }

  if (response.status >= 500) {
    throw new FlightProviderError(
      "The flight-data service is temporarily unavailable.",
      "PROVIDER_UNAVAILABLE"
    );
  }

  if (!response.ok) {
    throw new FlightProviderError(
      "The flight-data service returned an unexpected error.",
      "PROVIDER_UNAVAILABLE"
    );
  }

  return (await response.json()) as T;
}

export class AeroDataBoxProvider implements FlightDataProvider {
  async searchFlight(params: FlightLookupRequest): Promise<{
    flights: FlightLookupResult[];
    rawCount: number;
    skippedCount: number;
  }> {
    const encodedNumber = encodeURIComponent(params.flightNumber);
    const encodedDate = encodeURIComponent(params.date);

    const rawFlights = await fetchAeroDataBox<AeroFlight[]>(
      `/flights/number/${encodedNumber}/${encodedDate}`,
      { dateLocalRole: "Departure" }
    );

    const mapped: FlightLookupResult[] = [];
    const rawCount = rawFlights?.length ?? 0;
    let skippedCount = 0;

    for (const raw of rawFlights ?? []) {
      const departure = await enrichAirport(mapAirportFromMovement(raw.departure));
      const arrival = await enrichAirport(mapAirportFromMovement(raw.arrival));

      if (!departure || !arrival) {
        skippedCount += 1;
        continue;
      }

      const mappedFlight = mapFlightBase(raw, params, departure, arrival);
      if (!mappedFlight) {
        skippedCount += 1;
        continue;
      }

      mapped.push(mappedFlight);
    }

    return { flights: mapped, rawCount, skippedCount };
  }
}

export function createAeroDataBoxProvider(): FlightDataProvider {
  return new AeroDataBoxProvider();
}

import "server-only";

import {
  getCachedLookupResults,
  setCachedLookupResults,
} from "@/lib/flights/lookup-cache";
import { normalizeFlightNumber } from "@/lib/flights/normalize-flight-number";
import { getFlightDataProvider } from "@/lib/flights/providers/index";
import {
  type FlightLookupOutcome,
  type FlightLookupRequest,
  type FlightLookupResult,
  FlightProviderError,
} from "@/lib/flights/providers/types";
import { sortFlightsByScheduledDeparture } from "@/lib/flights/time-matching";

export class FlightLookupError extends Error {
  code:
    | "NOT_FOUND"
    | "AMBIGUOUS"
    | "INVALID_INPUT"
    | "MISSING_COORDINATES"
    | "AUTH_ERROR"
    | "QUOTA_EXCEEDED"
    | "PROVIDER_UNAVAILABLE"
    | "TIMEOUT"
    | "CONFIGURATION";

  constructor(message: string, code: FlightLookupError["code"]) {
    super(message);
    this.code = code;
  }
}

function mapProviderError(error: FlightProviderError): FlightLookupError {
  switch (error.code) {
    case "AUTH_ERROR":
      return new FlightLookupError(
        "The flight-data service rejected the API key. Check AERODATABOX_API_KEY in .env.local and restart the dev server.",
        "AUTH_ERROR"
      );
    case "QUOTA_EXCEEDED":
      return new FlightLookupError(
        "The flight-data service quota was exceeded. Try again later or upgrade your AeroDataBox plan.",
        "QUOTA_EXCEEDED"
      );
    case "TIMEOUT":
      return new FlightLookupError(
        "The flight-data service timed out. Please try again.",
        "TIMEOUT"
      );
    case "INVALID_FLIGHT_NUMBER":
      return new FlightLookupError(
        "The flight number format was rejected by the flight-data service.",
        "INVALID_INPUT"
      );
    case "DATE_OUT_OF_RANGE":
      return new FlightLookupError(
        "That date is outside the range available on your AeroDataBox plan. Try a more recent date or enter the flight manually.",
        "NOT_FOUND"
      );
    case "CONFIGURATION":
      return new FlightLookupError(
        "Flight lookup is not configured. Add AERODATABOX_API_KEY to .env.local and restart the dev server.",
        "CONFIGURATION"
      );
    default:
      return new FlightLookupError(
        "The flight-data service is temporarily unavailable. Please try again later.",
        "PROVIDER_UNAVAILABLE"
      );
  }
}

export async function lookupFlights(
  request: FlightLookupRequest
): Promise<FlightLookupOutcome> {
  const flightNumber = normalizeFlightNumber(request.flightNumber);

  let providerResults: FlightLookupResult[];
  let providerRawCount = 0;
  let providerSkippedCount = 0;

  const cached = getCachedLookupResults(flightNumber, request.date);
  if (cached) {
    providerResults = cached;
    providerRawCount = cached.length;
  } else {
    try {
      const search = await getFlightDataProvider().searchFlight({
        ...request,
        flightNumber,
      });
      providerResults = search.flights;
      providerRawCount = search.rawCount;
      providerSkippedCount = search.skippedCount;
      setCachedLookupResults(flightNumber, request.date, providerResults);
    } catch (error) {
      if (error instanceof FlightProviderError) {
        throw mapProviderError(error);
      }
      throw error;
    }
  }

  if (providerRawCount === 0) {
    return {
      status: "none",
      matches: [],
      reason: "provider_empty",
      searchedFlightNumber: flightNumber,
      providerRawCount,
      providerSkippedCount,
      message: `The flight-data service returned no flights for ${flightNumber} on ${request.date}. This date may be outside your plan's history window, or the flight may not be in AeroDataBox.`,
      suggestions: [
        "Double-check the flight number on your boarding pass (leading zeros are removed automatically, e.g. AC030 → AC30).",
        "Try a nearby date if the flight crossed midnight locally.",
        "Use Enter flight manually if the flight is older or not in the API.",
      ],
    };
  }

  if (providerResults.length === 0) {
    return {
      status: "none",
      matches: [],
      reason: "provider_filtered",
      searchedFlightNumber: flightNumber,
      providerRawCount,
      providerSkippedCount,
      message: `The flight-data service returned ${providerRawCount} result(s) for ${flightNumber} on ${request.date}, but none could be used because airport coordinates or scheduled departure times were missing.`,
      suggestions: [
        "Use Enter flight manually and pick airports from the local list.",
        "Try again later in case the provider data was incomplete.",
      ],
    };
  }

  const matches = sortFlightsByScheduledDeparture(providerResults);

  if (matches.length === 1) {
    return {
      status: "single",
      matches,
      bestMatch: matches[0],
      searchedFlightNumber: flightNumber,
    };
  }

  return {
    status: "multiple",
    matches,
    bestMatch: matches[0],
    searchedFlightNumber: flightNumber,
    message:
      "Several flights were found on this date. Please select the one you took.",
  };
}

export interface FlightLookupRequest {
  flightNumber: string;
  date: string;
}

export interface AirportLookupData {
  iata: string;
  icao?: string | null;
  name: string;
  city: string;
  /** Canonical English country name. */
  country: string;
  /** ISO 3166-1 alpha-2 when known. */
  countryCode?: string | null;
  latitude: number;
  longitude: number;
  timezone?: string | null;
}

export interface FlightLookupResult {
  providerId?: string | null;
  marketingFlightNumber: string;
  operatingFlightNumber?: string | null;
  airlineName: string;
  airlineIata?: string | null;
  codeshareStatus?: string | null;
  departure: AirportLookupData;
  arrival: AirportLookupData;
  scheduledDepartureAt: string;
  scheduledArrivalAt?: string | null;
  actualDepartureAt?: string | null;
  actualArrivalAt?: string | null;
  aircraftModel?: string | null;
  aircraftTypeCode?: string | null;
  aircraftRegistration?: string | null;
  departureTerminal?: string | null;
  departureGate?: string | null;
  arrivalTerminal?: string | null;
  arrivalGate?: string | null;
  status?: string | null;
  distanceKm?: number | null;
  source: string;
}

export type FlightLookupOutcomeStatus =
  | "single"
  | "multiple"
  | "none"
  | "ambiguous";

export type FlightLookupFailureReason =
  | "provider_empty"
  | "provider_filtered"
  | "time_window"
  | "time_ambiguous_filtered";

export interface FlightLookupOutcome {
  status: FlightLookupOutcomeStatus;
  matches: FlightLookupResult[];
  bestMatch?: FlightLookupResult;
  message?: string;
  reason?: FlightLookupFailureReason;
  suggestions?: string[];
  searchedFlightNumber?: string;
  providerRawCount?: number;
  providerSkippedCount?: number;
}

export interface FlightDataProvider {
  searchFlight(
    params: FlightLookupRequest
  ): Promise<{
    flights: FlightLookupResult[];
    rawCount: number;
    skippedCount: number;
  }>;
  getAirportByCode?(
    codeType: "iata" | "icao",
    code: string
  ): Promise<AirportLookupData | null>;
}

export class FlightProviderError extends Error {
  code:
    | "AUTH_ERROR"
    | "QUOTA_EXCEEDED"
    | "PROVIDER_UNAVAILABLE"
    | "TIMEOUT"
    | "DATE_OUT_OF_RANGE"
    | "INVALID_FLIGHT_NUMBER"
    | "NOT_FOUND"
    | "CONFIGURATION";

  constructor(
    message: string,
    code: FlightProviderError["code"]
  ) {
    super(message);
    this.code = code;
  }
}

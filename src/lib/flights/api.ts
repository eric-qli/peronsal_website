import {
  lookupResultToCreatePayload,
} from "@/lib/flights/mappers";
import { type FlightLookupResult } from "@/lib/flights/providers/types";
import { type CreateFlightPayload } from "@/lib/flights/schemas";
import { type Flight, type UpdateFlightInput } from "@/lib/flights/types";
import { type FlightLookupOutcome } from "@/lib/flights/providers/types";

export class FlightsApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string[]>;
  duplicateFlight?: Flight;

  constructor(
    message: string,
    code: string,
    status: number,
    fields?: Record<string, string[]>,
    duplicateFlight?: Flight
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
    this.duplicateFlight = duplicateFlight;
  }
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[]>;
  };
  duplicate?: Flight;
}

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: T | ApiErrorBody | null = null;

  try {
    payload = (await response.json()) as T | ApiErrorBody;
  } catch {
    throw new FlightsApiError(
      "Received an invalid response from the server.",
      "DATABASE_ERROR",
      response.status
    );
  }

  if (!response.ok) {
    const errorPayload = payload as ApiErrorBody;
    throw new FlightsApiError(
      errorPayload.error?.message ?? "Request failed.",
      errorPayload.error?.code ?? "DATABASE_ERROR",
      response.status,
      errorPayload.error?.fields,
      errorPayload.duplicate
    );
  }

  return payload as T;
}

export interface FlightLookupRequestInput {
  flightNumber: string;
  date: string;
}

export async function getFlights(): Promise<Flight[]> {
  const response = await fetch("/api/flights", { cache: "no-store" });
  const payload = await parseResponse<{ data: Flight[] }>(response);
  return payload.data;
}

export async function lookupFlight(
  input: FlightLookupRequestInput,
  signal?: AbortSignal
): Promise<FlightLookupOutcome> {
  const response = await fetch("/api/flights/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
    signal,
  });

  const payload = await parseResponse<{ data: FlightLookupOutcome }>(response);
  return payload.data;
}

export async function createFlight(
  input: CreateFlightPayload
): Promise<Flight> {
  const response = await fetch("/api/flights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const payload = await parseResponse<{ data: Flight }>(response);
  return payload.data;
}

export async function createFlightFromLookup(
  result: FlightLookupResult,
  options: {
    departureDate: string;
    cabinClass?: CreateFlightPayload["cabinClass"];
    seat?: string | null;
    notes?: string | null;
    forceDuplicate?: boolean;
  }
): Promise<Flight> {
  const payload = lookupResultToCreatePayload(result, options);
  return createFlight({
    ...payload,
    forceDuplicate: options.forceDuplicate,
  });
}

export async function updateFlight(
  id: string,
  input: UpdateFlightInput
): Promise<Flight> {
  const response = await fetch(`/api/flights/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const payload = await parseResponse<{ data: Flight }>(response);
  return payload.data;
}

export async function deleteFlight(id: string): Promise<void> {
  const response = await fetch(`/api/flights/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });

  await parseResponse<{ success: true }>(response);
}

export type { CreateFlightPayload };

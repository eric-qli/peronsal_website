import "server-only";

import { getAirportByIata } from "@/lib/flights/airports";
import { calculateDistanceKm } from "@/lib/flights/distance";
import { mapRowToFlight, mapRowsToFlights } from "@/lib/flights/mappers";
import {
  type CreateFlightPayload,
  type UpdateFlightPayload,
} from "@/lib/flights/schemas";
import { type Flight } from "@/lib/flights/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  type FlightInsert,
  type FlightRow,
} from "@/lib/supabase/flight-row";

export class AirportLookupError extends Error {
  field: "departureIata" | "arrivalIata";

  constructor(field: "departureIata" | "arrivalIata", iata: string) {
    super(`Airport code not found: ${iata}`);
    this.field = field;
  }
}

export class DuplicateFlightError extends Error {
  existingFlight: Flight;

  constructor(existingFlight: Flight) {
    super("This flight may already be in your history.");
    this.existingFlight = existingFlight;
  }
}

export class FlightDatabaseError extends Error {
  code: "SCHEMA_OUTDATED" | "INSERT_FAILED" | "UPDATE_FAILED" | "QUERY_FAILED";

  constructor(
    message: string,
    code: FlightDatabaseError["code"]
  ) {
    super(message);
    this.code = code;
  }
}

function isMissingColumnError(message: string): boolean {
  return /column .* does not exist|could not find the '.*' column|schema cache/i.test(
    message
  );
}

function resolveAirport(
  iata: string,
  overrides?: {
    name?: string | null;
    city?: string | null;
    country?: string | null;
    lat?: number;
    lng?: number;
  }
) {
  if (
    overrides?.lat !== undefined &&
    overrides?.lng !== undefined &&
    overrides.lat !== null &&
    overrides.lng !== null
  ) {
    return {
      iata: iata.toUpperCase(),
      name: overrides.name ?? iata,
      city: overrides.city ?? "",
      country: overrides.country ?? "",
      latitude: overrides.lat,
      longitude: overrides.lng,
    };
  }

  const airport = getAirportByIata(iata);
  if (!airport) {
    return null;
  }

  return {
    iata: airport.iata,
    name: overrides?.name ?? airport.name,
    city: overrides?.city ?? airport.city,
    country: overrides?.country ?? airport.country,
    latitude: airport.latitude,
    longitude: airport.longitude,
  };
}

function buildCoreInsertFromPayload(payload: CreateFlightPayload): FlightInsert {
  const departure = resolveAirport(payload.departureIata, {
    name: payload.departureAirport,
    city: payload.departureCity,
    country: payload.departureCountry,
    lat: payload.departureLat,
    lng: payload.departureLng,
  });

  if (!departure) {
    throw new AirportLookupError("departureIata", payload.departureIata);
  }

  const arrival = resolveAirport(payload.arrivalIata, {
    name: payload.arrivalAirport,
    city: payload.arrivalCity,
    country: payload.arrivalCountry,
    lat: payload.arrivalLat,
    lng: payload.arrivalLng,
  });

  if (!arrival) {
    throw new AirportLookupError("arrivalIata", payload.arrivalIata);
  }

  const distanceKm =
    payload.distanceKm ??
    calculateDistanceKm(
      departure.latitude,
      departure.longitude,
      arrival.latitude,
      arrival.longitude
    );

  return {
    flight_number: payload.flightNumber,
    airline: payload.airline,
    departure_iata: departure.iata,
    departure_airport: departure.name,
    departure_city: departure.city,
    departure_country: departure.country,
    departure_lat: departure.latitude,
    departure_lng: departure.longitude,
    arrival_iata: arrival.iata,
    arrival_airport: arrival.name,
    arrival_city: arrival.city,
    arrival_country: arrival.country,
    arrival_lat: arrival.latitude,
    arrival_lng: arrival.longitude,
    departure_date: payload.departureDate,
    aircraft: payload.aircraft,
    cabin_class: payload.cabinClass,
    seat: payload.seat,
    notes: payload.notes,
    distance_km: distanceKm,
  };
}

function buildExtendedInsertFields(
  payload: CreateFlightPayload
): Partial<FlightInsert> {
  return {
    scheduled_departure_at: payload.scheduledDepartureAt ?? null,
    scheduled_arrival_at: payload.scheduledArrivalAt ?? null,
    actual_departure_at: payload.actualDepartureAt ?? null,
    actual_arrival_at: payload.actualArrivalAt ?? null,
    operating_flight_number: payload.operatingFlightNumber ?? null,
    aircraft_type_code: payload.aircraftTypeCode ?? null,
    aircraft_registration: payload.aircraftRegistration ?? null,
    departure_terminal: payload.departureTerminal ?? null,
    departure_gate: payload.departureGate ?? null,
    arrival_terminal: payload.arrivalTerminal ?? null,
    arrival_gate: payload.arrivalGate ?? null,
    flight_status: payload.flightStatus ?? null,
    data_source: payload.dataSource ?? null,
    provider_flight_id: payload.providerFlightId ?? null,
  };
}

function buildInsertFromPayload(payload: CreateFlightPayload): FlightInsert {
  return {
    ...buildCoreInsertFromPayload(payload),
    ...buildExtendedInsertFields(payload),
  };
}

function buildUpdateFromPayload(
  existing: FlightRow,
  payload: UpdateFlightPayload
): Partial<FlightInsert> {
  const update: Partial<FlightInsert> = {};

  if (payload.flightNumber !== undefined) {
    update.flight_number = payload.flightNumber;
  }
  if (payload.airline !== undefined) {
    update.airline = payload.airline;
  }
  if (payload.departureDate !== undefined) {
    update.departure_date = payload.departureDate;
  }
  if (payload.aircraft !== undefined) {
    update.aircraft = payload.aircraft;
  }
  if (payload.cabinClass !== undefined) {
    update.cabin_class = payload.cabinClass;
  }
  if (payload.seat !== undefined) {
    update.seat = payload.seat;
  }
  if (payload.notes !== undefined) {
    update.notes = payload.notes;
  }

  const departureIata = payload.departureIata ?? existing.departure_iata;
  const arrivalIata = payload.arrivalIata ?? existing.arrival_iata;

  if (
    payload.departureIata !== undefined ||
    payload.arrivalIata !== undefined ||
    payload.departureLat !== undefined ||
    payload.arrivalLat !== undefined
  ) {
    const departure = resolveAirport(departureIata, {
      name: payload.departureAirport ?? existing.departure_airport,
      city: payload.departureCity ?? existing.departure_city,
      country: payload.departureCountry ?? existing.departure_country,
      lat: payload.departureLat ?? existing.departure_lat,
      lng: payload.departureLng ?? existing.departure_lng,
    });

    if (!departure) {
      throw new AirportLookupError("departureIata", departureIata);
    }

    const arrival = resolveAirport(arrivalIata, {
      name: payload.arrivalAirport ?? existing.arrival_airport,
      city: payload.arrivalCity ?? existing.arrival_city,
      country: payload.arrivalCountry ?? existing.arrival_country,
      lat: payload.arrivalLat ?? existing.arrival_lat,
      lng: payload.arrivalLng ?? existing.arrival_lng,
    });

    if (!arrival) {
      throw new AirportLookupError("arrivalIata", arrivalIata);
    }

    update.departure_iata = departure.iata;
    update.departure_airport = departure.name;
    update.departure_city = departure.city;
    update.departure_country = departure.country;
    update.departure_lat = departure.latitude;
    update.departure_lng = departure.longitude;
    update.arrival_iata = arrival.iata;
    update.arrival_airport = arrival.name;
    update.arrival_city = arrival.city;
    update.arrival_country = arrival.country;
    update.arrival_lat = arrival.latitude;
    update.arrival_lng = arrival.longitude;
    update.distance_km = calculateDistanceKm(
      departure.latitude,
      departure.longitude,
      arrival.latitude,
      arrival.longitude
    );
  }

  return update;
}

export async function findPotentialDuplicate(
  payload: CreateFlightPayload
): Promise<Flight | null> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("flights")
    .select("*")
    .eq("flight_number", payload.flightNumber)
    .eq("departure_iata", payload.departureIata.toUpperCase())
    .eq("arrival_iata", payload.arrivalIata.toUpperCase());

  if (payload.scheduledDepartureAt) {
    query = query.eq("scheduled_departure_at", payload.scheduledDepartureAt);
  } else {
    query = query.eq("departure_date", payload.departureDate);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    if (isMissingColumnError(error.message)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("flights")
        .select("*")
        .eq("flight_number", payload.flightNumber)
        .eq("departure_iata", payload.departureIata.toUpperCase())
        .eq("arrival_iata", payload.arrivalIata.toUpperCase())
        .eq("departure_date", payload.departureDate)
        .limit(1)
        .maybeSingle();

      if (fallbackError) {
        console.error("[flights] Failed duplicate lookup:", fallbackError.message);
        return null;
      }

      if (!fallbackData) return null;
      return mapRowToFlight(fallbackData as FlightRow);
    }

    console.error("[flights] Failed duplicate lookup:", error.message);
    return null;
  }

  if (!data) return null;

  return mapRowToFlight(data as FlightRow);
}

export async function listFlights(): Promise<Flight[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("flights")
    .select("*")
    .order("departure_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[flights] Failed to list flights:", error.message);
    throw new Error("DATABASE_ERROR");
  }

  return mapRowsToFlights((data ?? []) as FlightRow[]);
}

export async function getFlightById(id: string): Promise<Flight | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("flights")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[flights] Failed to fetch flight:", error.message);
    throw new Error("DATABASE_ERROR");
  }

  if (!data) return null;

  return mapRowToFlight(data as FlightRow);
}

export async function createFlight(
  payload: CreateFlightPayload
): Promise<Flight> {
  if (!payload.forceDuplicate) {
    const duplicate = await findPotentialDuplicate(payload);
    if (duplicate) {
      throw new DuplicateFlightError(duplicate);
    }
  }

  const supabase = createServerSupabaseClient();
  const coreInsert = buildCoreInsertFromPayload(payload);
  const fullInsert = buildInsertFromPayload(payload);

  let result = await supabase
    .from("flights")
    .insert(fullInsert)
    .select("*")
    .single();

  if (result.error && isMissingColumnError(result.error.message)) {
    console.warn(
      "[flights] Extended flight columns missing; saving core fields only. Run supabase/migrations/002_add_flight_lookup_fields.sql"
    );
    result = await supabase
      .from("flights")
      .insert(coreInsert)
      .select("*")
      .single();
  }

  if (result.error) {
    console.error("[flights] Failed to create flight:", result.error.message);

    if (isMissingColumnError(result.error.message)) {
      throw new FlightDatabaseError(
        "The flights table is missing required columns. Run supabase/migrations/002_add_flight_lookup_fields.sql in the Supabase SQL Editor, then try again.",
        "SCHEMA_OUTDATED"
      );
    }

    throw new FlightDatabaseError(
      "The flight could not be saved to the database. Please try again.",
      "INSERT_FAILED"
    );
  }

  return mapRowToFlight(result.data as FlightRow);
}

export async function updateFlight(
  id: string,
  payload: UpdateFlightPayload
): Promise<Flight | null> {
  const supabase = createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from("flights")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    console.error("[flights] Failed to fetch flight for update:", fetchError.message);
    throw new Error("DATABASE_ERROR");
  }

  if (!existing) return null;

  const update = buildUpdateFromPayload(existing as FlightRow, payload);

  const { data, error } = await supabase
    .from("flights")
    .update(update)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[flights] Failed to update flight:", error.message);
    throw new Error("DATABASE_ERROR");
  }

  if (!data) return null;

  return mapRowToFlight(data as FlightRow);
}

export async function deleteFlight(id: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();

  const { error, count } = await supabase
    .from("flights")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    console.error("[flights] Failed to delete flight:", error.message);
    throw new Error("DATABASE_ERROR");
  }

  return (count ?? 0) > 0;
}

import { type FlightRow } from "@/lib/supabase/flight-row";
import { type FlightLookupResult } from "@/lib/flights/providers/types";
import { type CreateFlightPayload } from "@/lib/flights/schemas";
import { normalizeFlightNumber } from "@/lib/flights/normalize-flight-number";
import { type CabinClass, type Flight } from "@/lib/flights/types";

export function mapRowToFlight(row: FlightRow): Flight {
  return {
    id: row.id,
    flightNumber: row.flight_number,
    airline: row.airline,
    departureIata: row.departure_iata,
    departureAirport: row.departure_airport,
    departureCity: row.departure_city,
    departureCountry: row.departure_country,
    departureLat: row.departure_lat,
    departureLng: row.departure_lng,
    arrivalIata: row.arrival_iata,
    arrivalAirport: row.arrival_airport,
    arrivalCity: row.arrival_city,
    arrivalCountry: row.arrival_country,
    arrivalLat: row.arrival_lat,
    arrivalLng: row.arrival_lng,
    departureDate: row.departure_date,
    aircraft: row.aircraft,
    cabinClass: row.cabin_class as CabinClass | null,
    seat: row.seat,
    notes: row.notes,
    distanceKm: row.distance_km,
    scheduledDepartureAt: row.scheduled_departure_at,
    scheduledArrivalAt: row.scheduled_arrival_at,
    actualDepartureAt: row.actual_departure_at,
    actualArrivalAt: row.actual_arrival_at,
    operatingFlightNumber: row.operating_flight_number,
    aircraftTypeCode: row.aircraft_type_code,
    aircraftRegistration: row.aircraft_registration,
    departureTerminal: row.departure_terminal,
    departureGate: row.departure_gate,
    arrivalTerminal: row.arrival_terminal,
    arrivalGate: row.arrival_gate,
    flightStatus: row.flight_status,
    dataSource: row.data_source,
    providerFlightId: row.provider_flight_id,
    createdAt: row.created_at,
  };
}

export function mapRowsToFlights(rows: FlightRow[]): Flight[] {
  return rows.map(mapRowToFlight);
}

export function lookupResultToCreatePayload(
  result: FlightLookupResult,
  options: {
    departureDate: string;
    cabinClass?: CabinClass | null;
    seat?: string | null;
    notes?: string | null;
  }
): CreateFlightPayload {
  return {
    flightNumber: normalizeFlightNumber(result.marketingFlightNumber),
    airline: result.airlineName,
    departureIata: result.departure.iata,
    arrivalIata: result.arrival.iata,
    departureDate: options.departureDate,
    aircraft: result.aircraftModel ?? null,
    cabinClass: options.cabinClass ?? null,
    seat: options.seat ?? null,
    notes: options.notes ?? null,
    departureAirport: result.departure.name,
    departureCity: result.departure.city,
    departureCountry: result.departure.country,
    arrivalAirport: result.arrival.name,
    arrivalCity: result.arrival.city,
    arrivalCountry: result.arrival.country,
    departureLat: result.departure.latitude,
    departureLng: result.departure.longitude,
    arrivalLat: result.arrival.latitude,
    arrivalLng: result.arrival.longitude,
    scheduledDepartureAt: result.scheduledDepartureAt,
    scheduledArrivalAt: result.scheduledArrivalAt ?? null,
    actualDepartureAt: result.actualDepartureAt ?? null,
    actualArrivalAt: result.actualArrivalAt ?? null,
    operatingFlightNumber: result.operatingFlightNumber ?? null,
    aircraftTypeCode: result.aircraftTypeCode ?? null,
    aircraftRegistration: result.aircraftRegistration ?? null,
    departureTerminal: result.departureTerminal ?? null,
    departureGate: result.departureGate ?? null,
    arrivalTerminal: result.arrivalTerminal ?? null,
    arrivalGate: result.arrivalGate ?? null,
    flightStatus: result.status ?? null,
    dataSource: result.source,
    providerFlightId: result.providerId ?? null,
    distanceKm: result.distanceKm ?? null,
  };
}

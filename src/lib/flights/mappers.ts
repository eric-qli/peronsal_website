import { type FlightRow } from "@/lib/supabase/flight-row";
import { type FlightLookupResult } from "@/lib/flights/providers/types";
import { type CreateFlightPayload } from "@/lib/flights/schemas";
import { normalizeAirport } from "@/lib/flights/location-normalize";
import { normalizeFlightNumber } from "@/lib/flights/normalize-flight-number";
import { type CabinClass, type Flight } from "@/lib/flights/types";

export function mapRowToFlight(row: FlightRow): Flight {
  const departure = normalizeAirport({
    airportCode: row.departure_iata,
    name: row.departure_airport,
    city: row.departure_city,
    country: row.departure_country,
  });
  const arrival = normalizeAirport({
    airportCode: row.arrival_iata,
    name: row.arrival_airport,
    city: row.arrival_city,
    country: row.arrival_country,
  });

  return {
    id: row.id,
    flightNumber: row.flight_number,
    airline: row.airline,
    departureIata: departure.airportCode,
    departureAirport: departure.name,
    departureCity: departure.city,
    departureCountry: departure.countryName || null,
    departureCountryCode: departure.countryCode,
    departureLat: row.departure_lat,
    departureLng: row.departure_lng,
    arrivalIata: arrival.airportCode,
    arrivalAirport: arrival.name,
    arrivalCity: arrival.city,
    arrivalCountry: arrival.countryName || null,
    arrivalCountryCode: arrival.countryCode,
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
  const departure = normalizeAirport({
    airportCode: result.departure.iata,
    name: result.departure.name,
    city: result.departure.city,
    country: result.departure.country,
    countryCode: result.departure.countryCode,
  });
  const arrival = normalizeAirport({
    airportCode: result.arrival.iata,
    name: result.arrival.name,
    city: result.arrival.city,
    country: result.arrival.country,
    countryCode: result.arrival.countryCode,
  });

  return {
    flightNumber: normalizeFlightNumber(result.marketingFlightNumber),
    airline: result.airlineName,
    departureIata: departure.airportCode,
    arrivalIata: arrival.airportCode,
    departureDate: options.departureDate,
    aircraft: result.aircraftModel ?? null,
    cabinClass: options.cabinClass ?? null,
    seat: options.seat ?? null,
    notes: options.notes ?? null,
    departureAirport: departure.name,
    departureCity: departure.city,
    departureCountry: departure.countryName,
    arrivalAirport: arrival.name,
    arrivalCity: arrival.city,
    arrivalCountry: arrival.countryName,
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

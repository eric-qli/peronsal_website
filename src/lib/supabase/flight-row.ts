import { type CabinClass } from "@/lib/flights/types";

export interface FlightRow {
  id: string;
  flight_number: string | null;
  airline: string | null;
  departure_iata: string;
  departure_airport: string | null;
  departure_city: string | null;
  departure_country: string | null;
  departure_lat: number;
  departure_lng: number;
  arrival_iata: string;
  arrival_airport: string | null;
  arrival_city: string | null;
  arrival_country: string | null;
  arrival_lat: number;
  arrival_lng: number;
  departure_date: string;
  aircraft: string | null;
  cabin_class: CabinClass | null;
  seat: string | null;
  notes: string | null;
  distance_km: number | null;
  scheduled_departure_at: string | null;
  scheduled_arrival_at: string | null;
  actual_departure_at: string | null;
  actual_arrival_at: string | null;
  operating_flight_number: string | null;
  aircraft_type_code: string | null;
  aircraft_registration: string | null;
  departure_terminal: string | null;
  departure_gate: string | null;
  arrival_terminal: string | null;
  arrival_gate: string | null;
  flight_status: string | null;
  data_source: string | null;
  provider_flight_id: string | null;
  created_at: string;
}

export interface FlightInsert {
  flight_number?: string | null;
  airline?: string | null;
  departure_iata: string;
  departure_airport?: string | null;
  departure_city?: string | null;
  departure_country?: string | null;
  departure_lat: number;
  departure_lng: number;
  arrival_iata: string;
  arrival_airport?: string | null;
  arrival_city?: string | null;
  arrival_country?: string | null;
  arrival_lat: number;
  arrival_lng: number;
  departure_date: string;
  aircraft?: string | null;
  cabin_class?: CabinClass | null;
  seat?: string | null;
  notes?: string | null;
  distance_km?: number | null;
  scheduled_departure_at?: string | null;
  scheduled_arrival_at?: string | null;
  actual_departure_at?: string | null;
  actual_arrival_at?: string | null;
  operating_flight_number?: string | null;
  aircraft_type_code?: string | null;
  aircraft_registration?: string | null;
  departure_terminal?: string | null;
  departure_gate?: string | null;
  arrival_terminal?: string | null;
  arrival_gate?: string | null;
  flight_status?: string | null;
  data_source?: string | null;
  provider_flight_id?: string | null;
}

export type FlightUpdate = Partial<FlightInsert>;

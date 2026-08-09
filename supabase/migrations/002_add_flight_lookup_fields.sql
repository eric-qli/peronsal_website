-- Optional flight lookup metadata columns.
-- Run in Supabase SQL Editor after 001_create_flights.sql.

alter table public.flights
  add column if not exists scheduled_departure_at timestamptz,
  add column if not exists scheduled_arrival_at timestamptz,
  add column if not exists actual_departure_at timestamptz,
  add column if not exists actual_arrival_at timestamptz,
  add column if not exists operating_flight_number text,
  add column if not exists aircraft_type_code text,
  add column if not exists aircraft_registration text,
  add column if not exists departure_terminal text,
  add column if not exists departure_gate text,
  add column if not exists arrival_terminal text,
  add column if not exists arrival_gate text,
  add column if not exists flight_status text,
  add column if not exists data_source text,
  add column if not exists provider_flight_id text;

create index if not exists flights_scheduled_departure_at_idx
  on public.flights (scheduled_departure_at);

create index if not exists flights_duplicate_lookup_idx
  on public.flights (flight_number, departure_iata, arrival_iata, scheduled_departure_at);

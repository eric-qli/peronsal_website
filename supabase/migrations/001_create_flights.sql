-- Flight log table for personal flight history map.
-- Run this in the Supabase SQL Editor or via the Supabase CLI.

create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  flight_number text,
  airline text,
  departure_iata text not null,
  departure_airport text,
  departure_city text,
  departure_country text,
  departure_lat double precision not null,
  departure_lng double precision not null,
  arrival_iata text not null,
  arrival_airport text,
  arrival_city text,
  arrival_country text,
  arrival_lat double precision not null,
  arrival_lng double precision not null,
  departure_date date not null,
  aircraft text,
  cabin_class text,
  seat text,
  notes text,
  distance_km double precision,
  created_at timestamptz default now()
);

create index if not exists flights_departure_date_idx
  on public.flights (departure_date desc);

create index if not exists flights_created_at_idx
  on public.flights (created_at desc);

-- Row Level Security
--
-- This site has no user authentication. The Next.js API routes use the
-- Supabase service role on the server, which bypasses RLS. These policies
-- block direct browser access with the public anon key so strangers cannot
-- insert, read, update, or delete flights through the Supabase REST API.
--
-- If you add Supabase Auth later, replace these policies with user-scoped rules,
-- for example: using (auth.uid() = owner_id).
alter table public.flights enable row level security;

create policy "flights_deny_anon_select"
  on public.flights
  for select
  to anon
  using (false);

create policy "flights_deny_anon_insert"
  on public.flights
  for insert
  to anon
  with check (false);

create policy "flights_deny_anon_update"
  on public.flights
  for update
  to anon
  using (false)
  with check (false);

create policy "flights_deny_anon_delete"
  on public.flights
  for delete
  to anon
  using (false);

create policy "flights_deny_authenticated_select"
  on public.flights
  for select
  to authenticated
  using (false);

create policy "flights_deny_authenticated_insert"
  on public.flights
  for insert
  to authenticated
  with check (false);

create policy "flights_deny_authenticated_update"
  on public.flights
  for update
  to authenticated
  using (false)
  with check (false);

create policy "flights_deny_authenticated_delete"
  on public.flights
  for delete
  to authenticated
  using (false);

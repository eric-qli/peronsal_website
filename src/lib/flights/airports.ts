/**
 * Static airport lookup dataset for IATA code resolution.
 *
 * To expand coverage later:
 * 1. Add entries to AIRPORTS below (one object per airport), or
 * 2. Replace this module with an API call / Supabase `airports` table lookup, or
 * 3. Import a larger curated JSON file and re-export getAirportByIata().
 *
 * Keep the Airport interface stable so callers do not need to change.
 */

import { normalizeAirport } from "@/lib/flights/location-normalize";

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  countryCode: string | null;
  latitude: number;
  longitude: number;
}

type AirportSeed = Omit<Airport, "countryCode">;

const AIRPORT_SEEDS: AirportSeed[] = [
  {
    iata: "YVR",
    name: "Vancouver International Airport",
    city: "Vancouver",
    country: "Canada",
    latitude: 49.1967,
    longitude: -123.1815,
  },
  {
    iata: "YYZ",
    name: "Toronto Pearson International Airport",
    city: "Toronto",
    country: "Canada",
    latitude: 43.6777,
    longitude: -79.6248,
  },
  {
    iata: "YUL",
    name: "Montréal–Trudeau International Airport",
    city: "Montreal",
    country: "Canada",
    latitude: 45.4706,
    longitude: -73.7408,
  },
  {
    iata: "YYC",
    name: "Calgary International Airport",
    city: "Calgary",
    country: "Canada",
    latitude: 51.1215,
    longitude: -114.0076,
  },
  {
    iata: "SEA",
    name: "Seattle–Tacoma International Airport",
    city: "Seattle",
    country: "United States",
    latitude: 47.4502,
    longitude: -122.3088,
  },
  {
    iata: "SFO",
    name: "San Francisco International Airport",
    city: "San Francisco",
    country: "United States",
    latitude: 37.6213,
    longitude: -122.379,
  },
  {
    iata: "LAX",
    name: "Los Angeles International Airport",
    city: "Los Angeles",
    country: "United States",
    latitude: 33.9416,
    longitude: -118.4085,
  },
  {
    iata: "JFK",
    name: "John F. Kennedy International Airport",
    city: "New York",
    country: "United States",
    latitude: 40.6413,
    longitude: -73.7781,
  },
  {
    iata: "EWR",
    name: "Newark Liberty International Airport",
    city: "Newark",
    country: "United States",
    latitude: 40.6895,
    longitude: -74.1745,
  },
  {
    iata: "BOS",
    name: "Boston Logan International Airport",
    city: "Boston",
    country: "United States",
    latitude: 42.3656,
    longitude: -71.0096,
  },
  {
    iata: "ORD",
    name: "O'Hare International Airport",
    city: "Chicago",
    country: "United States",
    latitude: 41.9742,
    longitude: -87.9073,
  },
  {
    iata: "ATL",
    name: "Hartsfield–Jackson Atlanta International Airport",
    city: "Atlanta",
    country: "United States",
    latitude: 33.6407,
    longitude: -84.4277,
  },
  {
    iata: "LHR",
    name: "London Heathrow Airport",
    city: "London",
    country: "United Kingdom",
    latitude: 51.47,
    longitude: -0.4543,
  },
  {
    iata: "CDG",
    name: "Paris Charles de Gaulle Airport",
    city: "Paris",
    country: "France",
    latitude: 49.0097,
    longitude: 2.5479,
  },
  {
    iata: "FRA",
    name: "Frankfurt Airport",
    city: "Frankfurt",
    country: "Germany",
    latitude: 50.0379,
    longitude: 8.5622,
  },
  {
    iata: "AMS",
    name: "Amsterdam Airport Schiphol",
    city: "Amsterdam",
    country: "Netherlands",
    latitude: 52.3105,
    longitude: 4.7683,
  },
  {
    iata: "PEK",
    name: "Beijing Capital International Airport",
    city: "Beijing",
    country: "China",
    latitude: 40.0799,
    longitude: 116.6031,
  },
  {
    iata: "PKX",
    name: "Beijing Daxing International Airport",
    city: "Beijing",
    country: "China",
    latitude: 39.5098,
    longitude: 116.4105,
  },
  {
    iata: "PVG",
    name: "Shanghai Pudong International Airport",
    city: "Shanghai",
    country: "China",
    latitude: 31.1443,
    longitude: 121.8083,
  },
  {
    iata: "HKG",
    name: "Hong Kong International Airport",
    city: "Hong Kong",
    country: "Hong Kong",
    latitude: 22.308,
    longitude: 113.9185,
  },
  {
    iata: "NRT",
    name: "Narita International Airport",
    city: "Tokyo",
    country: "Japan",
    latitude: 35.772,
    longitude: 140.3929,
  },
  {
    iata: "HND",
    name: "Tokyo Haneda Airport",
    city: "Tokyo",
    country: "Japan",
    latitude: 35.5494,
    longitude: 139.7798,
  },
  {
    iata: "ICN",
    name: "Incheon International Airport",
    city: "Seoul",
    country: "South Korea",
    latitude: 37.4602,
    longitude: 126.4407,
  },
  {
    iata: "SIN",
    name: "Singapore Changi Airport",
    city: "Singapore",
    country: "Singapore",
    latitude: 1.3644,
    longitude: 103.9915,
  },
];

const AIRPORTS: Airport[] = AIRPORT_SEEDS.map((seed) => {
  const normalized = normalizeAirport({
    airportCode: seed.iata,
    name: seed.name,
    city: seed.city,
    country: seed.country,
    latitude: seed.latitude,
    longitude: seed.longitude,
  });

  return {
    iata: normalized.airportCode,
    name: normalized.name,
    city: normalized.city,
    country: normalized.countryName,
    countryCode: normalized.countryCode,
    latitude: seed.latitude,
    longitude: seed.longitude,
  };
});

const AIRPORT_BY_IATA = new Map<string, Airport>(
  AIRPORTS.map((airport) => [airport.iata, airport])
);

export function normalizeIataCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidIataFormat(value: string): boolean {
  return /^[A-Z]{3}$/.test(normalizeIataCode(value));
}

export function getAirportByIata(iataCode: string): Airport | null {
  const normalized = normalizeIataCode(iataCode);
  if (!isValidIataFormat(normalized)) {
    return null;
  }

  return AIRPORT_BY_IATA.get(normalized) ?? null;
}

export function listKnownAirportCodes(): string[] {
  return AIRPORTS.map((airport) => airport.iata).sort();
}

export const cabinClasses = [
  "Economy",
  "Premium Economy",
  "Business",
  "First",
] as const;

export type CabinClass = (typeof cabinClasses)[number];

export interface Flight {
  id: string;
  flightNumber: string | null;
  airline: string | null;
  departureIata: string;
  departureAirport: string | null;
  departureCity: string | null;
  /** Canonical English country name for display. */
  departureCountry: string | null;
  /** ISO 3166-1 alpha-2 code for aggregation (derived/normalized). */
  departureCountryCode: string | null;
  departureLat: number;
  departureLng: number;
  arrivalIata: string;
  arrivalAirport: string | null;
  arrivalCity: string | null;
  /** Canonical English country name for display. */
  arrivalCountry: string | null;
  /** ISO 3166-1 alpha-2 code for aggregation (derived/normalized). */
  arrivalCountryCode: string | null;
  arrivalLat: number;
  arrivalLng: number;
  departureDate: string;
  aircraft: string | null;
  cabinClass: CabinClass | null;
  seat: string | null;
  notes: string | null;
  distanceKm: number | null;
  scheduledDepartureAt: string | null;
  scheduledArrivalAt: string | null;
  actualDepartureAt: string | null;
  actualArrivalAt: string | null;
  operatingFlightNumber: string | null;
  aircraftTypeCode: string | null;
  aircraftRegistration: string | null;
  departureTerminal: string | null;
  departureGate: string | null;
  arrivalTerminal: string | null;
  arrivalGate: string | null;
  flightStatus: string | null;
  dataSource: string | null;
  providerFlightId: string | null;
  createdAt: string;
}

export interface CreateFlightInput {
  flightNumber: string;
  airline: string;
  departureIata: string;
  arrivalIata: string;
  departureDate: string;
  aircraft?: string | null;
  cabinClass?: CabinClass | null;
  seat?: string | null;
  notes?: string | null;
}

export interface UpdateFlightInput {
  flightNumber?: string;
  airline?: string;
  departureIata?: string;
  arrivalIata?: string;
  departureDate?: string;
  aircraft?: string | null;
  cabinClass?: CabinClass | null;
  seat?: string | null;
  notes?: string | null;
}

export interface FlightStats {
  totalFlights: number;
  totalDistanceKm: number;
  uniqueAirports: number;
  uniqueCountries: number;
  uniqueCities: number;
}

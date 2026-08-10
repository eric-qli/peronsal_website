import {
  getCityAggregationKey,
  getCountryAggregationKey,
  normalizeCity,
  normalizeCountry,
} from "@/lib/flights/location-normalize";
import { type Flight, type FlightStats } from "@/lib/flights/types";

export function computeFlightStats(flights: Flight[]): FlightStats {
  const airportCodes = new Set<string>();
  const countries = new Set<string>();
  const cities = new Set<string>();

  let totalDistanceKm = 0;

  for (const flight of flights) {
    airportCodes.add(flight.departureIata);
    airportCodes.add(flight.arrivalIata);

    const departureCountry = normalizeCountry(
      flight.departureCountry,
      flight.departureCountryCode
    );
    const arrivalCountry = normalizeCountry(
      flight.arrivalCountry,
      flight.arrivalCountryCode
    );

    const departureCountryKey = getCountryAggregationKey(departureCountry);
    const arrivalCountryKey = getCountryAggregationKey(arrivalCountry);
    if (departureCountryKey) countries.add(departureCountryKey);
    if (arrivalCountryKey) countries.add(arrivalCountryKey);

    const departureCity = normalizeCity(
      flight.departureCity,
      flight.departureCountry,
      flight.departureCountryCode,
      flight.departureIata
    );
    const arrivalCity = normalizeCity(
      flight.arrivalCity,
      flight.arrivalCountry,
      flight.arrivalCountryCode,
      flight.arrivalIata
    );

    cities.add(
      departureCity.cityKey ||
        getCityAggregationKey(departureCity.city, departureCountry)
    );
    cities.add(
      arrivalCity.cityKey ||
        getCityAggregationKey(arrivalCity.city, arrivalCountry)
    );

    if (flight.distanceKm !== null) {
      totalDistanceKm += flight.distanceKm;
    }
  }

  return {
    totalFlights: flights.length,
    totalDistanceKm,
    uniqueAirports: airportCodes.size,
    uniqueCountries: countries.size,
    uniqueCities: cities.size,
  };
}

export function formatFlightDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

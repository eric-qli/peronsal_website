import { type FlightLookupResult } from "@/lib/flights/providers/types";

export const MATCH_WINDOW_MINUTES = 360;
export const AUTO_SELECT_GAP_MINUTES = 60;
export const AMBIGUOUS_GAP_MINUTES = 45;

interface ParsedLocalDateTime {
  date: string;
  minutes: number;
}

function parseLocalDateTime(isoLocal: string): ParsedLocalDateTime | null {
  const match = isoLocal.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;

  return {
    date: match[1]!,
    minutes: Number(match[2]) * 60 + Number(match[3]),
  };
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function dayOffset(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00Z`).getTime();
  const to = new Date(`${toDate}T00:00:00Z`).getTime();
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

export function departureTimeDifferenceMinutes(
  userDate: string,
  approximateLocalTime: string,
  scheduledDepartureAt: string
): number | null {
  const scheduledLocal = scheduledDepartureAt.includes("T")
    ? scheduledDepartureAt
    : null;

  if (!scheduledLocal) {
    return null;
  }

  const parsedScheduled = parseLocalDateTime(scheduledLocal);
  if (!parsedScheduled) {
    return null;
  }

  const userMinutes = parseTimeToMinutes(approximateLocalTime);
  const dayDiff = dayOffset(userDate, parsedScheduled.date);
  const scheduledMinutes = parsedScheduled.minutes + dayDiff * 24 * 60;

  return Math.abs(scheduledMinutes - userMinutes);
}

export interface RankedFlightMatch {
  flight: FlightLookupResult;
  differenceMinutes: number;
}

export function rankFlightsByDepartureTime(
  flights: FlightLookupResult[],
  userDate: string,
  approximateLocalTime: string,
  options?: { maxDifferenceMinutes?: number }
): RankedFlightMatch[] {
  const maxDifferenceMinutes = options?.maxDifferenceMinutes ?? MATCH_WINDOW_MINUTES;
  const ranked: RankedFlightMatch[] = [];

  for (const flight of flights) {
    const differenceMinutes = departureTimeDifferenceMinutes(
      userDate,
      approximateLocalTime,
      flight.scheduledDepartureAt
    );

    if (differenceMinutes === null) {
      continue;
    }

    if (differenceMinutes <= maxDifferenceMinutes) {
      ranked.push({ flight, differenceMinutes });
    }
  }

  return ranked.sort((a, b) => a.differenceMinutes - b.differenceMinutes);
}

export function rankAllFlightsByDepartureTime(
  flights: FlightLookupResult[],
  userDate: string,
  approximateLocalTime: string
): RankedFlightMatch[] {
  return rankFlightsByDepartureTime(flights, userDate, approximateLocalTime, {
    maxDifferenceMinutes: Number.POSITIVE_INFINITY,
  });
}

export function sortFlightsByScheduledDeparture(
  flights: FlightLookupResult[]
): FlightLookupResult[] {
  return [...flights].sort((a, b) =>
    a.scheduledDepartureAt.localeCompare(b.scheduledDepartureAt)
  );
}

export function findClosestFlightByDepartureTime(
  flights: FlightLookupResult[],
  userDate: string,
  approximateLocalTime: string
): RankedFlightMatch[] {
  return rankFlightsByDepartureTime(flights, userDate, approximateLocalTime);
}

export function classifyTimeMatches(
  ranked: RankedFlightMatch[]
): {
  status: "single" | "multiple" | "none" | "ambiguous";
  bestMatch?: FlightLookupResult;
  matches: FlightLookupResult[];
} {
  if (ranked.length === 0) {
    return { status: "none", matches: [] };
  }

  const matches = ranked.map((item) => item.flight);
  const best = ranked[0]!;
  const second = ranked[1];

  if (!second) {
    return { status: "single", bestMatch: best.flight, matches };
  }

  const gap = second.differenceMinutes - best.differenceMinutes;

  if (gap >= AUTO_SELECT_GAP_MINUTES) {
    return { status: "single", bestMatch: best.flight, matches };
  }

  if (gap < AMBIGUOUS_GAP_MINUTES) {
    return { status: "ambiguous", matches };
  }

  return { status: "multiple", bestMatch: best.flight, matches };
}

export function formatLocalDateTime(isoTimestamp: string): string {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return isoTimestamp;
  }

  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDurationMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  return `${hours}h ${mins}m`;
}

export function formatTimeDifference(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }

  return formatDurationMinutes(minutes);
}

export function computeDurationMinutes(
  departureAt: string,
  arrivalAt: string | null | undefined
): number | null {
  if (!arrivalAt) return null;

  const departure = new Date(departureAt).getTime();
  const arrival = new Date(arrivalAt).getTime();

  if (Number.isNaN(departure) || Number.isNaN(arrival)) {
    return null;
  }

  return Math.max(0, Math.round((arrival - departure) / 60000));
}

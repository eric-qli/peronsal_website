import { z } from "zod";
import { cabinClasses } from "@/lib/flights/types";
import {
  isValidDateString,
  isValidFlightNumber,
  normalizeFlightNumber,
} from "@/lib/flights/normalize-flight-number";

function normalizeOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeIata(value: unknown): string {
  return String(value).trim().toUpperCase();
}

const iataSchema = z
  .string()
  .trim()
  .transform(normalizeIata)
  .refine((value) => /^[A-Z]{3}$/.test(value), {
    message: "Airport code must be a three-letter IATA code.",
  });

const optionalTimestampSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .superRefine((value, ctx) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return;
    }

    const parsed = new Date(String(value).trim());
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid date and time.",
      });
    }
  })
  .transform((value) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      return null;
    }

    return new Date(String(value).trim()).toISOString();
  });

const VALIDATION_FIELD_LABELS: Record<string, string> = {
  flightNumber: "Flight number",
  airline: "Airline",
  departureIata: "Departure airport",
  arrivalIata: "Arrival airport",
  departureDate: "Departure date",
  scheduledDepartureAt: "Scheduled departure",
  scheduledArrivalAt: "Scheduled arrival",
  actualDepartureAt: "Actual departure",
  actualArrivalAt: "Actual arrival",
  cabinClass: "Cabin class",
  seat: "Seat",
  aircraft: "Aircraft",
};

export function formatFlightValidationMessage(
  fields: Record<string, string[]>
): string {
  const entries = Object.entries(fields);
  if (entries.length === 0) {
    return "Invalid flight data.";
  }

  const [field, messages] = entries[0]!;
  const label = VALIDATION_FIELD_LABELS[field] ?? field.replace(/([A-Z])/g, " $1").trim();
  return `${label}: ${messages[0]}`;
}

export const flightLookupRequestSchema = z.object({
  flightNumber: z
    .string()
    .trim()
    .transform(normalizeFlightNumber)
    .refine(isValidFlightNumber, {
      message: "Enter a valid flight number.",
    }),
  date: z
    .string()
    .trim()
    .refine(isValidDateString, {
      message: "Enter a valid date.",
    }),
});

export const createFlightSchema = z.object({
  flightNumber: z
    .string()
    .trim()
    .transform(normalizeFlightNumber)
    .refine(isValidFlightNumber, {
      message: "Enter a valid flight number.",
    }),
  airline: z
    .string()
    .trim()
    .min(1, "Airline is required.")
    .max(120, "Airline must be 120 characters or fewer."),
  departureIata: iataSchema,
  arrivalIata: iataSchema,
  departureDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Departure date must use YYYY-MM-DD format."),
  aircraft: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString),
  cabinClass: z
    .union([z.enum(cabinClasses), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value ? value : null)),
  seat: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString),
  notes: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString),
  departureAirport: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  departureCity: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  departureCountry: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  arrivalAirport: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  arrivalCity: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  arrivalCountry: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  departureLat: z.number().optional(),
  departureLng: z.number().optional(),
  arrivalLat: z.number().optional(),
  arrivalLng: z.number().optional(),
  scheduledDepartureAt: optionalTimestampSchema.optional(),
  scheduledArrivalAt: optionalTimestampSchema.optional(),
  actualDepartureAt: optionalTimestampSchema.optional(),
  actualArrivalAt: optionalTimestampSchema.optional(),
  operatingFlightNumber: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  aircraftTypeCode: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  aircraftRegistration: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  departureTerminal: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  departureGate: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  arrivalTerminal: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  arrivalGate: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  flightStatus: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  dataSource: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  providerFlightId: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .optional(),
  distanceKm: z.number().optional().nullable(),
  forceDuplicate: z.boolean().optional(),
});

export const updateFlightSchema = createFlightSchema
  .omit({ forceDuplicate: true })
  .partial();

export type CreateFlightPayload = z.infer<typeof createFlightSchema>;
export type UpdateFlightPayload = z.infer<typeof updateFlightSchema>;
export type FlightLookupRequestPayload = z.infer<
  typeof flightLookupRequestSchema
>;

export const flightIdSchema = z.string().uuid("Invalid flight id.");

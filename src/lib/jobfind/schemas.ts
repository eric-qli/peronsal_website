import { z } from "zod";
import { applicationStatuses } from "@/lib/jobfind/types";

function normalizeOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSkills(value: unknown): string[] {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of items) {
    const trimmed = String(item).trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

const optionalUrlSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform(normalizeOptionalString)
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Source URL must be a valid http or https URL." }
  );

function getTodayDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export const createJobApplicationSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Company is required.")
    .max(200, "Company must be 200 characters or fewer."),
  position: z
    .string()
    .trim()
    .min(1, "Position is required.")
    .max(200, "Position must be 200 characters or fewer."),
  location: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString),
  status: z.enum(applicationStatuses).optional().default("applied"),
  dateApplied: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date applied must use YYYY-MM-DD format.")
    .optional()
    .default(getTodayDateString),
  requiredSkills: z
    .union([z.array(z.string()), z.string(), z.null(), z.undefined()])
    .optional()
    .transform(normalizeSkills),
  sourceUrl: optionalUrlSchema.optional(),
  notes: z
    .union([z.string(), z.null(), z.undefined()])
    .transform(normalizeOptionalString)
    .refine((value) => !value || value.length <= 5000, {
      message: "Notes must be 5000 characters or fewer.",
    })
    .optional(),
});

export const updateJobApplicationSchema = createJobApplicationSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required to update an application.",
  });

export const applicationIdSchema = z.string().uuid("Invalid application ID.");

export type CreateJobApplicationPayload = z.infer<
  typeof createJobApplicationSchema
>;
export type UpdateJobApplicationPayload = z.infer<
  typeof updateJobApplicationSchema
>;

export function createPayloadToInsert(
  input: CreateJobApplicationPayload
): Record<string, unknown> {
  return {
    company: input.company,
    position: input.position,
    location: input.location,
    status: input.status,
    date_applied: input.dateApplied,
    required_skills: input.requiredSkills,
    source_url: input.sourceUrl,
    notes: input.notes,
  };
}

export function updatePayloadToInsert(
  input: UpdateJobApplicationPayload
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.company !== undefined) payload.company = input.company;
  if (input.position !== undefined) payload.position = input.position;
  if (input.location !== undefined) payload.location = input.location;
  if (input.status !== undefined) payload.status = input.status;
  if (input.dateApplied !== undefined) payload.date_applied = input.dateApplied;
  if (input.requiredSkills !== undefined) {
    payload.required_skills = input.requiredSkills;
  }
  if (input.sourceUrl !== undefined) payload.source_url = input.sourceUrl;
  if (input.notes !== undefined) payload.notes = input.notes;

  return payload;
}

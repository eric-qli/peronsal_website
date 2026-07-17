import { type JobApplication } from "@/lib/jobfind/types";
import {
  type JobApplicationInsert,
  type JobApplicationRow,
  type JobApplicationUpdate,
} from "@/lib/supabase/job-application-row";

export function mapRowToJobApplication(row: JobApplicationRow): JobApplication {
  return {
    id: row.id,
    company: row.company,
    position: row.position,
    location: row.location,
    status: row.status,
    dateApplied: row.date_applied,
    requiredSkills: row.required_skills ?? [],
    sourceUrl: row.source_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRowsToJobApplications(
  rows: JobApplicationRow[]
): JobApplication[] {
  return rows.map(mapRowToJobApplication);
}

export function mapCreateInputToInsert(
  input: JobApplicationInsert
): JobApplicationInsert {
  return {
    company: input.company,
    position: input.position,
    location: input.location ?? null,
    status: input.status ?? "applied",
    date_applied: input.date_applied,
    required_skills: input.required_skills ?? [],
    source_url: input.source_url ?? null,
    notes: input.notes ?? null,
  };
}

export function mapUpdateInputToRow(
  input: JobApplicationUpdate
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.company !== undefined) payload.company = input.company;
  if (input.position !== undefined) payload.position = input.position;
  if (input.location !== undefined) payload.location = input.location;
  if (input.status !== undefined) payload.status = input.status;
  if (input.date_applied !== undefined) payload.date_applied = input.date_applied;
  if (input.required_skills !== undefined) {
    payload.required_skills = input.required_skills;
  }
  if (input.source_url !== undefined) payload.source_url = input.source_url;
  if (input.notes !== undefined) payload.notes = input.notes;

  return payload;
}

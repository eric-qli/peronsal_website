import "server-only";

import {
  mapRowToJobApplication,
  mapRowsToJobApplications,
} from "@/lib/jobfind/mappers";
import {
  createPayloadToInsert,
  updatePayloadToInsert,
  type CreateJobApplicationPayload,
  type UpdateJobApplicationPayload,
} from "@/lib/jobfind/schemas";
import { type JobApplication, type SortOption } from "@/lib/jobfind/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { type JobApplicationRow } from "@/lib/supabase/job-application-row";

export interface ListApplicationsOptions {
  status?: string;
  search?: string;
  sort?: SortOption;
}

function applySort(rows: JobApplicationRow[], sort: SortOption): JobApplicationRow[] {
  const sorted = [...rows];

  switch (sort) {
    case "oldest":
      return sorted.sort((a, b) => {
        const dateCompare = a.date_applied.localeCompare(b.date_applied);
        return dateCompare !== 0
          ? dateCompare
          : a.created_at.localeCompare(b.created_at);
      });
    case "company_asc":
      return sorted.sort((a, b) => a.company.localeCompare(b.company));
    case "company_desc":
      return sorted.sort((a, b) => b.company.localeCompare(a.company));
    case "newest":
    default:
      return sorted.sort((a, b) => {
        const dateCompare = b.date_applied.localeCompare(a.date_applied);
        return dateCompare !== 0
          ? dateCompare
          : b.created_at.localeCompare(a.created_at);
      });
  }
}

export async function listApplications(
  options: ListApplicationsOptions = {}
): Promise<JobApplication[]> {
  const supabase = createServerSupabaseClient();
  let query = supabase.from("job_applications").select("*");

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const search = options.search?.trim();
  if (search) {
    const escaped = search.replace(/[%_,]/g, "");
    const pattern = `%${escaped}%`;
    query = query.or(
      `company.ilike.${pattern},position.ilike.${pattern},location.ilike.${pattern}`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[jobfind] Failed to list applications:", error.message);
    throw new Error("DATABASE_ERROR");
  }

  const rows = (data ?? []) as JobApplicationRow[];
  return mapRowsToJobApplications(applySort(rows, options.sort ?? "newest"));
}

export async function getApplicationById(
  id: string
): Promise<JobApplication | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[jobfind] Failed to fetch application:", error.message);
    throw new Error("DATABASE_ERROR");
  }

  if (!data) return null;

  return mapRowToJobApplication(data as JobApplicationRow);
}

export async function createApplication(
  input: CreateJobApplicationPayload
): Promise<JobApplication> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("job_applications")
    .insert(createPayloadToInsert(input))
    .select("*")
    .single();

  if (error) {
    console.error("[jobfind] Failed to create application:", error.message);
    throw new Error("DATABASE_ERROR");
  }

  return mapRowToJobApplication(data as JobApplicationRow);
}

export async function updateApplication(
  id: string,
  input: UpdateJobApplicationPayload
): Promise<JobApplication | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("job_applications")
    .update(updatePayloadToInsert(input))
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[jobfind] Failed to update application:", error.message);
    throw new Error("DATABASE_ERROR");
  }

  if (!data) return null;

  return mapRowToJobApplication(data as JobApplicationRow);
}

export async function deleteApplication(id: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();

  const { error, count } = await supabase
    .from("job_applications")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    console.error("[jobfind] Failed to delete application:", error.message);
    throw new Error("DATABASE_ERROR");
  }

  return (count ?? 0) > 0;
}

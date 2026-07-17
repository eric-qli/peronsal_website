import {
  type ApiErrorBody,
  type ApiErrorCode,
} from "@/lib/jobfind/errors";
import {
  type CreateJobApplicationInput,
  type JobApplication,
  type SortOption,
  type UpdateJobApplicationInput,
} from "@/lib/jobfind/types";

export class JobFindApiError extends Error {
  code: ApiErrorCode;
  status: number;
  fields?: Record<string, string[]>;

  constructor(
    message: string,
    code: ApiErrorCode,
    status: number,
    fields?: Record<string, string[]>
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export interface FetchApplicationsParams {
  status?: string;
  search?: string;
  sort?: SortOption;
}

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: T | ApiErrorBody | null = null;

  try {
    payload = (await response.json()) as T | ApiErrorBody;
  } catch {
    throw new JobFindApiError(
      "Received an invalid response from the server.",
      "DATABASE_ERROR",
      response.status
    );
  }

  if (!response.ok) {
    const errorPayload = payload as ApiErrorBody;
    throw new JobFindApiError(
      errorPayload.error?.message ?? "Request failed.",
      errorPayload.error?.code ?? "DATABASE_ERROR",
      response.status,
      errorPayload.error?.fields
    );
  }

  return payload as T;
}

export async function getApplications(
  params: FetchApplicationsParams = {}
): Promise<JobApplication[]> {
  const searchParams = new URLSearchParams();

  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }
  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  const query = searchParams.toString();
  const response = await fetch(
    `/api/jobfind/applications${query ? `?${query}` : ""}`
  );

  const payload = await parseResponse<{ data: JobApplication[] }>(response);
  return payload.data;
}

export async function getApplication(id: string): Promise<JobApplication> {
  const response = await fetch(`/api/jobfind/applications/${id}`);
  const payload = await parseResponse<{ data: JobApplication }>(response);
  return payload.data;
}

export async function createApplication(
  input: CreateJobApplicationInput
): Promise<JobApplication> {
  const response = await fetch("/api/jobfind/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = await parseResponse<{ data: JobApplication }>(response);
  return payload.data;
}

export async function updateApplication(
  id: string,
  input: UpdateJobApplicationInput
): Promise<JobApplication> {
  const response = await fetch(`/api/jobfind/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = await parseResponse<{ data: JobApplication }>(response);
  return payload.data;
}

export async function deleteApplication(id: string): Promise<void> {
  const response = await fetch(`/api/jobfind/applications/${id}`, {
    method: "DELETE",
  });

  await parseResponse<{ success: true }>(response);
}

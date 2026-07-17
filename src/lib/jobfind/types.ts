export const applicationStatuses = [
  "saved",
  "applied",
  "oa",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string | null;
  status: ApplicationStatus;
  dateApplied: string;
  requiredSkills: string[];
  sourceUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobApplicationInput {
  company: string;
  position: string;
  location?: string | null;
  status?: ApplicationStatus;
  dateApplied?: string;
  requiredSkills?: string[];
  sourceUrl?: string | null;
  notes?: string | null;
}

export interface UpdateJobApplicationInput {
  company?: string;
  position?: string;
  location?: string | null;
  status?: ApplicationStatus;
  dateApplied?: string;
  requiredSkills?: string[];
  sourceUrl?: string | null;
  notes?: string | null;
}

export interface ApplicationStats {
  applications: number;
  oa: number;
  interviews: number;
  offers: number;
  rejections: number;
}

export const statusFilterOptions = ["all", ...applicationStatuses] as const;

export type StatusFilter = (typeof statusFilterOptions)[number];

export const sortOptions = [
  { value: "newest", label: "Date (Newest)" },
  { value: "oldest", label: "Date (Oldest)" },
  { value: "company_asc", label: "Company (A–Z)" },
  { value: "company_desc", label: "Company (Z–A)" },
] as const;

export type SortOption = (typeof sortOptions)[number]["value"];

export const statusLabels: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  oa: "OA",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function calculateApplicationStats(
  applications: JobApplication[]
): ApplicationStats {
  return {
    applications: applications.length,
    oa: applications.filter((app) => app.status === "oa").length,
    interviews: applications.filter((app) => app.status === "interview").length,
    offers: applications.filter((app) => app.status === "offer").length,
    rejections: applications.filter((app) => app.status === "rejected").length,
  };
}

import { type ApplicationStatus } from "@/lib/jobfind/types";

export interface JobApplicationRow {
  id: string;
  company: string;
  position: string;
  location: string | null;
  status: ApplicationStatus;
  date_applied: string;
  required_skills: string[];
  source_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplicationInsert {
  company: string;
  position: string;
  location?: string | null;
  status?: ApplicationStatus;
  date_applied?: string;
  required_skills?: string[];
  source_url?: string | null;
  notes?: string | null;
}

export type JobApplicationUpdate = Partial<JobApplicationInsert>;

export type ApplicationStatus =
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Pending";

export interface Application {
  id: string;
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  dateApplied: string;
  resumeMatch: number;
  keywords: string[];
}

export interface RecentInput {
  id: string;
  title: string;
  url: string;
  submittedAt: string;
}

export interface ApplicationStats {
  applications: number;
  interviews: number;
  offers: number;
  rejections: number;
  responseRate: number;
}

export const applicationStats: ApplicationStats = {
  applications: 0,
  interviews: 0,
  offers: 0,
  rejections: 0,
  responseRate: 0,
};

export const mockApplications: Application[] = [];

export const mockRecentInputs: RecentInput[] = [];

export const statusFilterOptions: Array<ApplicationStatus | "All"> = [
  "All",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Pending",
];

export const sortOptions = [
  { value: "date-desc", label: "Date (Newest)" },
  { value: "date-asc", label: "Date (Oldest)" },
  { value: "company-asc", label: "Company (A–Z)" },
  { value: "company-desc", label: "Company (Z–A)" },
  { value: "match-desc", label: "Resume Match (High–Low)" },
  { value: "match-asc", label: "Resume Match (Low–High)" },
] as const;

export type SortOption = (typeof sortOptions)[number]["value"];

import {
  statusLabels,
  type ApplicationStatus,
  type JobApplication,
} from "@/lib/jobfind/types";

export interface ChartSegment {
  name: string;
  count: number;
  percentage: number;
}

const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#84cc16",
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

function toSegments(
  counts: Map<string, number>,
  total: number,
  maxCategories?: number
): ChartSegment[] {
  if (total === 0) return [];

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  if (maxCategories && sorted.length > maxCategories) {
    const top = sorted.slice(0, maxCategories - 1);
    const otherCount = sorted
      .slice(maxCategories - 1)
      .reduce((sum, [, count]) => sum + count, 0);

    const combined = [...top, ["Other", otherCount] as const];
    return combined.map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }));
  }

  return sorted.map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / total) * 100),
  }));
}

function formatStatusLabel(status: string | undefined | null): string {
  if (!status?.trim()) return "Unknown";

  if (status in statusLabels) {
    return statusLabels[status as ApplicationStatus];
  }

  return status.trim();
}

const CANADA_LOCATION_KEYWORDS = [
  "canada",
  "toronto",
  "vancouver",
  "montreal",
  "calgary",
  "ottawa",
  "waterloo",
  "ontario",
  "quebec",
  "british columbia",
  "alberta",
];

const US_LOCATION_KEYWORDS = [
  "united states",
  "usa",
  "u.s.",
  "new york",
  "california",
  "texas",
  "seattle",
  "san francisco",
  "boston",
  "chicago",
];

export function normalizeLocationCategory(location: string | null): string {
  if (!location?.trim()) return "Unknown";

  const trimmed = location.trim();
  const lower = trimmed.toLowerCase();

  if (/\bremote\b/.test(lower)) return "Remote";

  if (CANADA_LOCATION_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return "Canada";
  }

  if (US_LOCATION_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return "United States";
  }

  if (/\b(china|beijing)\b/.test(lower)) return "China";

  return trimmed;
}

export function groupApplicationsByStatus(
  applications: JobApplication[]
): ChartSegment[] {
  const counts = new Map<string, number>();

  for (const application of applications) {
    const label = formatStatusLabel(application.status);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return toSegments(counts, applications.length);
}

export function groupApplicationsByLocation(
  applications: JobApplication[]
): ChartSegment[] {
  const counts = new Map<string, number>();

  for (const application of applications) {
    const label = normalizeLocationCategory(application.location);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return toSegments(counts, applications.length, 6);
}

export function groupApplicationsByCompany(
  applications: JobApplication[]
): ChartSegment[] {
  const counts = new Map<string, number>();

  for (const application of applications) {
    const label = application.company?.trim() || "Unknown";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return toSegments(counts, applications.length, 6);
}

export function getCompanyRankings(
  applications: JobApplication[]
): ChartSegment[] {
  const counts = new Map<string, number>();

  for (const application of applications) {
    const label = application.company?.trim() || "Unknown";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = applications.length;
  if (total === 0) return [];

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }));
}

const PLACEHOLDER_VALUES = new Set([
  "null",
  "n/a",
  "na",
  "none",
  "unknown",
  "not specified",
  "not available",
]);

export function normalizeOptionalText(value: string | null | undefined): string {
  if (value === undefined || value === null) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (PLACEHOLDER_VALUES.has(trimmed.toLowerCase())) return "";
  return trimmed;
}

export function linesInputToArray(value: string): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const line of value.split(/\r?\n/)) {
    for (const part of line.split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      normalized.push(trimmed);
    }
  }

  return normalized;
}

export function getTodayDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function formatDisplayDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function skillsArrayToInput(skills: string[]) {
  return skills.join(", ");
}

export function skillsInputToArray(value: string) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of value.split(",")) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

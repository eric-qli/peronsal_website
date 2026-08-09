export function normalizeFlightNumber(value: string): string {
  const normalized = value.trim().replace(/\s+/g, "").toUpperCase();
  const match = normalized.match(/^([A-Z]{2,3})(\d+)$/);

  if (!match) {
    return normalized;
  }

  const airline = match[1]!;
  const flightDigits = String(Number.parseInt(match[2]!, 10));

  return `${airline}${flightDigits}`;
}

export function isValidFlightNumber(value: string): boolean {
  const normalized = normalizeFlightNumber(value);
  return /^[A-Z0-9]{2,7}$/.test(normalized);
}

export function isValidLocalTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

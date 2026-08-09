const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function calculateDistanceKm(
  departureLat: number,
  departureLng: number,
  arrivalLat: number,
  arrivalLng: number
): number {
  const lat1 = toRadians(departureLat);
  const lat2 = toRadians(arrivalLat);
  const deltaLat = toRadians(arrivalLat - departureLat);
  const deltaLng = toRadians(arrivalLng - departureLng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_KM * c);
}

export function formatDistanceKm(distanceKm: number | null): string {
  if (distanceKm === null || Number.isNaN(distanceKm)) {
    return "—";
  }

  return `${distanceKm.toLocaleString()} km`;
}

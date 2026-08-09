import "server-only";

import { createAeroDataBoxProvider } from "@/lib/flights/providers/aerodatabox";
import { type FlightDataProvider } from "@/lib/flights/providers/types";

export function getFlightDataProvider(): FlightDataProvider {
  return createAeroDataBoxProvider();
}

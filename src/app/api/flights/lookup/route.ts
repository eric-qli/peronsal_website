import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  isConfigurationError,
  logConfigurationError,
  zodFields,
} from "@/lib/jobfind/errors";
import {
  FlightLookupError,
  lookupFlights,
} from "@/lib/flights/lookup-service";
import { flightLookupRequestSchema } from "@/lib/flights/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = flightLookupRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid flight lookup request.",
        400,
        zodFields(parsed.error)
      );
    }

    const data = await lookupFlights(parsed.data);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return apiError("INVALID_JSON", "Invalid JSON body.", 400);
    }

    if (error instanceof FlightLookupError) {
      const status =
        error.code === "CONFIGURATION"
          ? 500
          : error.code === "AUTH_ERROR" || error.code === "QUOTA_EXCEEDED"
            ? 502
            : 404;

      return apiError(
        error.code === "CONFIGURATION"
          ? "CONFIGURATION_ERROR"
          : "NOT_FOUND",
        error.message,
        status
      );
    }

    if (isConfigurationError(error)) {
      logConfigurationError(error, "POST /flights/lookup configuration");
      return apiError(
        "CONFIGURATION_ERROR",
        "Server configuration error.",
        500
      );
    }

    console.error("[flights] POST /flights/lookup failed:", error);
    return apiError(
      "DATABASE_ERROR",
      "The flight-data service is temporarily unavailable. Please try again later.",
      502
    );
  }
}

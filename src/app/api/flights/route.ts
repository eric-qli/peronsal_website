import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  isConfigurationError,
  logConfigurationError,
  zodFields,
} from "@/lib/jobfind/errors";
import {
  AirportLookupError,
  createFlight,
  DuplicateFlightError,
  FlightDatabaseError,
  listFlights,
} from "@/lib/flights/queries";
import { createFlightSchema, formatFlightValidationMessage } from "@/lib/flights/schemas";

export async function GET() {
  try {
    const data = await listFlights();
    return NextResponse.json({ data });
  } catch (error) {
    if (isConfigurationError(error)) {
      logConfigurationError(error, "GET /flights configuration");
      return apiError(
        "CONFIGURATION_ERROR",
        "Server configuration error.",
        500
      );
    }

    console.error("[flights] GET /flights failed:", error);
    return apiError("DATABASE_ERROR", "Failed to fetch flights.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createFlightSchema.safeParse(body);

    if (!parsed.success) {
      const fields = zodFields(parsed.error);
      return apiError(
        "VALIDATION_ERROR",
        formatFlightValidationMessage(fields),
        400,
        fields
      );
    }

    const data = await createFlight(parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return apiError("INVALID_JSON", "Invalid JSON body.", 400);
    }

    if (error instanceof AirportLookupError) {
      return apiError(
        "VALIDATION_ERROR",
        error.message,
        400,
        { [error.field]: [error.message] }
      );
    }

    if (error instanceof DuplicateFlightError) {
      return NextResponse.json(
        {
          error: {
            code: "DUPLICATE_FLIGHT",
            message: error.message,
          },
          duplicate: error.existingFlight,
        },
        { status: 409 }
      );
    }

    if (error instanceof FlightDatabaseError) {
      return apiError("DATABASE_ERROR", error.message, 500);
    }

    if (isConfigurationError(error)) {
      logConfigurationError(error, "POST /flights configuration");
      return apiError(
        "CONFIGURATION_ERROR",
        "Server configuration error.",
        500
      );
    }

    console.error("[flights] POST /flights failed:", error);
    return apiError("DATABASE_ERROR", "Failed to create flight.", 500);
  }
}

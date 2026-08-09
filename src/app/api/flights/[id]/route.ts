import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  isConfigurationError,
  logConfigurationError,
  zodFields,
} from "@/lib/jobfind/errors";
import {
  AirportLookupError,
  deleteFlight,
  getFlightById,
  updateFlight,
} from "@/lib/flights/queries";
import {
  flightIdSchema,
  formatFlightValidationMessage,
  updateFlightSchema,
} from "@/lib/flights/schemas";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = flightIdSchema.safeParse(id);

    if (!parsedId.success) {
      return apiError("NOT_FOUND", "Flight not found.", 404);
    }

    const data = await getFlightById(parsedId.data);

    if (!data) {
      return apiError("NOT_FOUND", "Flight not found.", 404);
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (isConfigurationError(error)) {
      logConfigurationError(error, "GET /flights/[id] configuration");
      return apiError(
        "CONFIGURATION_ERROR",
        "Server configuration error.",
        500
      );
    }

    console.error("[flights] GET /flights/[id] failed:", error);
    return apiError("DATABASE_ERROR", "Failed to fetch flight.", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = flightIdSchema.safeParse(id);

    if (!parsedId.success) {
      return apiError("NOT_FOUND", "Flight not found.", 404);
    }

    const body = await request.json();
    const parsed = updateFlightSchema.safeParse(body);

    if (!parsed.success) {
      const fields = zodFields(parsed.error);
      return apiError(
        "VALIDATION_ERROR",
        formatFlightValidationMessage(fields),
        400,
        fields
      );
    }

    const data = await updateFlight(parsedId.data, parsed.data);

    if (!data) {
      return apiError("NOT_FOUND", "Flight not found.", 404);
    }

    return NextResponse.json({ data });
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

    if (isConfigurationError(error)) {
      logConfigurationError(error, "PATCH /flights/[id] configuration");
      return apiError(
        "CONFIGURATION_ERROR",
        "Server configuration error.",
        500
      );
    }

    console.error("[flights] PATCH /flights/[id] failed:", error);
    return apiError("DATABASE_ERROR", "Failed to update flight.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = flightIdSchema.safeParse(id);

    if (!parsedId.success) {
      return apiError("NOT_FOUND", "Flight not found.", 404);
    }

    const deleted = await deleteFlight(parsedId.data);

    if (!deleted) {
      return apiError("NOT_FOUND", "Flight not found.", 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isConfigurationError(error)) {
      logConfigurationError(error, "DELETE /flights/[id] configuration");
      return apiError(
        "CONFIGURATION_ERROR",
        "Server configuration error.",
        500
      );
    }

    console.error("[flights] DELETE /flights/[id] failed:", error);
    return apiError("DATABASE_ERROR", "Failed to delete flight.", 500);
  }
}

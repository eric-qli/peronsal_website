import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  isConfigurationError,
  zodFields,
} from "@/lib/jobfind/errors";
import {
  deleteApplication,
  getApplicationById,
  updateApplication,
} from "@/lib/jobfind/queries";
import {
  applicationIdSchema,
  updateJobApplicationSchema,
} from "@/lib/jobfind/schemas";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = applicationIdSchema.safeParse(id);

    if (!parsedId.success) {
      return apiError("VALIDATION_ERROR", "Invalid application ID.", 400);
    }

    const data = await getApplicationById(parsedId.data);

    if (!data) {
      return apiError("NOT_FOUND", "Application not found.", 404);
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (isConfigurationError(error)) {
      return apiError(
        "CONFIGURATION_ERROR",
        "Server configuration error.",
        500
      );
    }

    console.error("[jobfind] GET /applications/[id] failed:", error);
    return apiError(
      "DATABASE_ERROR",
      "Failed to fetch application.",
      500
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = applicationIdSchema.safeParse(id);

    if (!parsedId.success) {
      return apiError("VALIDATION_ERROR", "Invalid application ID.", 400);
    }

    const body = await request.json();
    const parsedBody = updateJobApplicationSchema.safeParse(body);

    if (!parsedBody.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid application data.",
        400,
        zodFields(parsedBody.error)
      );
    }

    const data = await updateApplication(parsedId.data, parsedBody.data);

    if (!data) {
      return apiError("NOT_FOUND", "Application not found.", 404);
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return apiError("INVALID_JSON", "Invalid JSON body.", 400);
    }

    if (isConfigurationError(error)) {
      return apiError(
        "CONFIGURATION_ERROR",
        "Server configuration error.",
        500
      );
    }

    console.error("[jobfind] PATCH /applications/[id] failed:", error);
    return apiError(
      "DATABASE_ERROR",
      "Failed to update application.",
      500
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = applicationIdSchema.safeParse(id);

    if (!parsedId.success) {
      return apiError("VALIDATION_ERROR", "Invalid application ID.", 400);
    }

    const deleted = await deleteApplication(parsedId.data);

    if (!deleted) {
      return apiError("NOT_FOUND", "Application not found.", 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isConfigurationError(error)) {
      return apiError(
        "CONFIGURATION_ERROR",
        "Server configuration error.",
        500
      );
    }

    console.error("[jobfind] DELETE /applications/[id] failed:", error);
    return apiError(
      "DATABASE_ERROR",
      "Failed to delete application.",
      500
    );
  }
}

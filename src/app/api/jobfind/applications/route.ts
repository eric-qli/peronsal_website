import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  isConfigurationError,
  zodFields,
} from "@/lib/jobfind/errors";
import {
  createApplication,
  listApplications,
} from "@/lib/jobfind/queries";
import {
  createJobApplicationSchema,
} from "@/lib/jobfind/schemas";
import { type SortOption } from "@/lib/jobfind/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const sort = (searchParams.get("sort") as SortOption | null) ?? "newest";

    const data = await listApplications({ status, search, sort });
    return NextResponse.json({ data });
  } catch (error) {
    if (isConfigurationError(error)) {
      return apiError(
        "CONFIGURATION_ERROR",
        "Server configuration error.",
        500
      );
    }

    console.error("[jobfind] GET /applications failed:", error);
    return apiError(
      "DATABASE_ERROR",
      "Failed to fetch applications.",
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createJobApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Invalid application data.",
        400,
        zodFields(parsed.error)
      );
    }

    const data = await createApplication(parsed.data);
    return NextResponse.json({ data }, { status: 201 });
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

    console.error("[jobfind] POST /applications failed:", error);
    return apiError(
      "DATABASE_ERROR",
      "Failed to create application.",
      500
    );
  }
}

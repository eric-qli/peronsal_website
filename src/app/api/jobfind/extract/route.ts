import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { zodFields } from "@/lib/jobfind/errors";
import {
  extractJobInformation,
  JobExtractionError,
} from "@/lib/openai/job-extractor";

const extractRequestSchema = z.object({
  jobDescription: z
    .string()
    .trim()
    .min(1, "Job description cannot be empty."),
});

function apiError(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string[]>
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(fields ? { fields } : {}),
      },
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = extractRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "Job description is required.",
        400,
        zodFields(parsed.error)
      );
    }

    const result = await extractJobInformation(parsed.data.jobDescription);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return apiError("INVALID_JSON", "Invalid JSON body.", 400);
    }

    if (error instanceof JobExtractionError) {
      const status =
        error.code === "CONFIGURATION"
          ? 500
          : error.code === "TIMEOUT"
            ? 504
            : error.code === "INVALID_JSON"
              ? 502
              : 502;

      return apiError(error.code, error.message, status);
    }

    console.error("[jobfind] POST /extract failed:", error);
    return apiError(
      "OPENAI",
      "OpenAI request failed. Please try again.",
      502
    );
  }
}

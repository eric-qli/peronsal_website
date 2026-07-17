import { NextResponse } from "next/server";
import { type ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DATABASE_ERROR"
  | "INVALID_JSON"
  | "CONFIGURATION_ERROR";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export function apiError(
  code: ApiErrorCode,
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

export function zodFields(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fields[key] = [...(fields[key] ?? []), issue.message];
  }

  return fields;
}

export function isConfigurationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Missing required environment variable")
  );
}

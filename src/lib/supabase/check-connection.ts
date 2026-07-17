import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SupabaseConnectionResult =
  | {
      success: true;
      rowCount: number;
    }
  | {
      success: false;
      type: "configuration" | "table_missing" | "database";
      message: string;
    };

function isMissingTableError(message: string, code?: string): boolean {
  if (code === "42P01" || code === "PGRST205") {
    return true;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes("job_applications") &&
    (normalized.includes("does not exist") ||
      normalized.includes("could not find the table") ||
      normalized.includes("schema cache"))
  );
}

export async function checkSupabaseConnection(): Promise<SupabaseConnectionResult> {
  let supabase;

  try {
    supabase = createServerSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Supabase is not configured correctly.";

    return {
      success: false,
      type: "configuration",
      message,
    };
  }

  const { data, error } = await supabase
    .from("job_applications")
    .select("id")
    .limit(1);

  if (error) {
    if (isMissingTableError(error.message, error.code)) {
      return {
        success: false,
        type: "table_missing",
        message:
          "Supabase was reached, but the job_applications table was not found.",
      };
    }

    console.error("[supabase] Connection test failed:", error.message);

    return {
      success: false,
      type: "database",
      message: "Supabase connection failed.",
    };
  }

  return {
    success: true,
    rowCount: data?.length ?? 0,
  };
}

import { checkSupabaseConnection } from "@/lib/supabase/check-connection";

export const dynamic = "force-dynamic";

export default async function JobFindDbTestPage() {
  const result = await checkSupabaseConnection();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Supabase Connection Test
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Temporary server-side check for the JobFind database connection.
        </p>
      </header>

      <div
        className={
          result.success
            ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4"
            : "rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-4"
        }
      >
        <p
          className={
            result.success
              ? "font-medium text-emerald-300"
              : "font-medium text-destructive"
          }
        >
          {result.success
            ? "Supabase connection successful."
            : result.type === "table_missing"
              ? result.message
              : "Supabase connection failed."}
        </p>

        {result.success && (
          <p className="mt-2 text-sm text-muted-foreground">
            Returned rows: {result.rowCount}
          </p>
        )}

        {!result.success && result.type !== "table_missing" && (
          <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
        )}
      </div>
    </div>
  );
}

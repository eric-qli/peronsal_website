import { DatabaseTestPanel } from "@/components/jobfind/database-test-panel";

export const dynamic = "force-dynamic";

export default function JobFindDbTestPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="font-medium text-amber-200">
            Development Database Testing Tool
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Records created here are saved to the connected Supabase database.
          </p>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Database CRUD Test
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Create, read, update, and delete job application records through the
            JobFind API routes.
          </p>
        </div>
      </header>

      <DatabaseTestPanel />
    </div>
  );
}

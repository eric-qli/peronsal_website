import { AiExtractionTestPanel } from "@/components/jobfind/ai-extraction-test-panel";

export const dynamic = "force-dynamic";

export default function JobFindDbTestPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="font-medium text-amber-200">
            Development AI Testing Tool
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            This page tests OpenAI extraction only. Nothing is saved to Supabase.
          </p>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            AI Job Extraction Test
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Paste a job description, call OpenAI, and inspect the structured JSON
            response.
          </p>
        </div>
      </header>

      <AiExtractionTestPanel />
    </div>
  );
}

import { InputForm } from "@/components/jobfind/input-form";
import { RecentInputs } from "@/components/jobfind/recent-inputs";
import { mockRecentInputs } from "@/lib/mock-jobfind-data";

export default function JobFindInputPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Job Listing Input
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Enter a job listing URL below to extract useful information.
        </p>
      </header>

      <InputForm />

      <RecentInputs inputs={mockRecentInputs} />
    </div>
  );
}

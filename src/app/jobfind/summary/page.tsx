import { ApplicationTable } from "@/components/jobfind/application-table";
import { SummaryStats } from "@/components/jobfind/summary-stats";
import {
  applicationStats,
  mockApplications,
} from "@/lib/mock-jobfind-data";

export default function JobFindSummaryPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Application Summary
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Track and manage your job applications in one place.
        </p>
      </header>

      <SummaryStats stats={applicationStats} />

      <ApplicationTable applications={mockApplications} />
    </div>
  );
}

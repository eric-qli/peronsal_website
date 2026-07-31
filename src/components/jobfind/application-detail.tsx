"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { ApplicationEditDialog } from "@/components/jobfind/application-edit-dialog";
import { CoverLetterSection } from "@/components/jobfind/cover-letter-section";
import { DeleteApplicationDialog } from "@/components/jobfind/delete-application-dialog";
import { MatchScoreCard } from "@/components/jobfind/match-score-card";
import { SkillList } from "@/components/jobfind/skill-list";
import { StatusSelect } from "@/components/jobfind/status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteApplication,
  getApplication,
  JobFindApiError,
  updateApplication,
} from "@/lib/jobfind/api";
import { calculateSkillMatch } from "@/lib/jobfind/match";
import { parseApplicationNotes } from "@/lib/jobfind/notes-parser";
import {
  statusLabels,
  type ApplicationStatus,
  type JobApplication,
} from "@/lib/jobfind/types";
import { formatDisplayDate } from "@/lib/jobfind/utils";

export function ApplicationDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadApplication = useCallback(async () => {
    if (!id) {
      setError("Invalid application ID.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getApplication(id);
      setApplication(data);
    } catch (err) {
      if (err instanceof JobFindApiError && err.status === 404) {
        setError("Application not found.");
      } else {
        setError("Unable to load this application.");
      }
      setApplication(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadApplication();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadApplication]);

  async function handleStatusChange(status: ApplicationStatus) {
    if (!application || application.status === status || isUpdatingStatus) {
      return;
    }

    const previousStatus = application.status;
    setIsUpdatingStatus(true);
    setStatusFeedback(null);
    setApplication({ ...application, status });

    try {
      const updated = await updateApplication(application.id, { status });
      setApplication(updated);
      setStatusFeedback("Status updated.");
    } catch {
      setApplication({ ...application, status: previousStatus });
      setStatusFeedback("Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!application) return;

    await deleteApplication(application.id);
    router.push("/jobfind/summary");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading application...
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          render={<Link href="/jobfind/summary" />}
          className="gap-2 px-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Summary
        </Button>
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error ?? "Unable to load this application."}
        </p>
      </div>
    );
  }

  const parsedNotes = parseApplicationNotes(application.notes);
  const match = calculateSkillMatch(application.requiredSkills);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="space-y-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Button
          variant="ghost"
          render={<Link href="/jobfind/summary" />}
          className="w-fit gap-2 px-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Summary
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {application.company}
          </h1>
          <p className="text-lg text-muted-foreground">{application.position}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {application.location && (
            <Badge variant="outline">{application.location}</Badge>
          )}
          <Badge variant="outline">{statusLabels[application.status]}</Badge>
          <Badge variant="outline">
            Applied {formatDisplayDate(application.dateApplied)}
          </Badge>
          {parsedNotes.employmentType && (
            <Badge variant="outline">{parsedNotes.employmentType}</Badge>
          )}
          {parsedNotes.experienceLevel && (
            <Badge variant="outline">{parsedNotes.experienceLevel}</Badge>
          )}
          {parsedNotes.salary && (
            <Badge variant="outline">{parsedNotes.salary}</Badge>
          )}
        </div>

        {application.sourceUrl && (
          <a
            href={application.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            <ExternalLink className="size-4" />
            View original posting
          </a>
        )}

        <div className="max-w-xs space-y-1">
          <p className="text-sm font-medium text-foreground">Status</p>
          <div className="flex items-center gap-2">
            <StatusSelect
              value={application.status}
              onValueChange={(status) => void handleStatusChange(status)}
              disabled={isUpdatingStatus}
            />
            {isUpdatingStatus && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {statusFeedback && (
            <p className="text-xs text-muted-foreground">{statusFeedback}</p>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <MatchScoreCard match={match} />

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SkillList
              title="Required Skills"
              skills={application.requiredSkills}
              emptyMessage="No required skills listed."
            />
            <SkillList
              title="Preferred Skills"
              skills={parsedNotes.preferredSkills}
              emptyMessage="No preferred skills listed."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Qualifications</CardTitle>
          </CardHeader>
          <CardContent>
            <SkillList
              skills={parsedNotes.qualifications}
              variant="list"
              emptyMessage="No qualifications listed."
            />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Responsibilities</CardTitle>
          </CardHeader>
          <CardContent>
            <SkillList
              skills={parsedNotes.responsibilities}
              variant="list"
              emptyMessage="No responsibilities listed."
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Application Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {parsedNotes.freeformNotes ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {parsedNotes.freeformNotes}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No notes added.</p>
          )}
        </CardContent>
      </Card>

      <CoverLetterSection
        key={application.location ?? "unknown-location"}
        applicationId={application.id}
        location={application.location}
      />

      <ApplicationEditDialog
        application={application}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={async () => {
          await loadApplication();
        }}
      />

      <DeleteApplicationDialog
        company={application.company}
        position={application.position}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteConfirm}
      />
    </motion.div>
  );
}

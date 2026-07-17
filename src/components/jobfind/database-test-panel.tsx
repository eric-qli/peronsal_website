"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApplicationFormFields,
  createEmptyFormValues,
  type ApplicationFormValues,
} from "@/components/jobfind/application-form";
import { ApplicationEditDialog } from "@/components/jobfind/application-edit-dialog";
import { DeleteApplicationDialog } from "@/components/jobfind/delete-application-dialog";
import { StatusSelect } from "@/components/jobfind/status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createApplication,
  deleteApplication,
  getApplications,
  JobFindApiError,
  updateApplication,
} from "@/lib/jobfind/api";
import { statusLabels, type JobApplication } from "@/lib/jobfind/types";
import { formatDisplayDate, skillsInputToArray } from "@/lib/jobfind/utils";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";

type ApiResult = {
  status: number;
  body: unknown;
  success: boolean;
  message: string;
};

export function DatabaseTestPanel() {
  const [form, setForm] = useState<ApplicationFormValues>(createEmptyFormValues());
  const [records, setRecords] = useState<JobApplication[]>([]);
  const [latestResult, setLatestResult] = useState<ApiResult | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobApplication | null>(null);
  const [editTarget, setEditTarget] = useState<JobApplication | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setIsLoadingRecords(true);

    try {
      const data = await getApplications({ sort: "newest" });
      setRecords(data);
      setLatestResult({
        status: 200,
        body: { data },
        success: true,
        message: `Loaded ${data.length} record${data.length === 1 ? "" : "s"}.`,
      });
    } catch (err) {
      const message =
        err instanceof JobFindApiError
          ? err.message
          : "Failed to load records.";
      setLatestResult({
        status: err instanceof JobFindApiError ? err.status : 500,
        body: {
          error: {
            code: err instanceof JobFindApiError ? err.code : "DATABASE_ERROR",
            message,
          },
        },
        success: false,
        message,
      });
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadRecords();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadRecords]);

  function handleClearForm() {
    setForm(createEmptyFormValues());
    setFeedback(null);
  }

  async function handleCreate() {
    if (isCreating) return;

    setIsCreating(true);
    setFeedback(null);

    try {
      const data = await createApplication({
        company: form.company,
        position: form.position,
        location: form.location,
        status: form.status,
        dateApplied: form.dateApplied,
        requiredSkills: skillsInputToArray(form.requiredSkills),
        sourceUrl: form.sourceUrl,
        notes: form.notes,
      });

      setLatestResult({
        status: 201,
        body: { data },
        success: true,
        message: "Record created successfully.",
      });
      setFeedback("Record created successfully.");
      setForm(createEmptyFormValues());
      await loadRecords();
    } catch (err) {
      const message =
        err instanceof JobFindApiError
          ? err.message
          : "Failed to create record.";
      setLatestResult({
        status: err instanceof JobFindApiError ? err.status : 500,
        body: {
          error: {
            code: err instanceof JobFindApiError ? err.code : "DATABASE_ERROR",
            message,
            fields: err instanceof JobFindApiError ? err.fields : undefined,
          },
        },
        success: false,
        message,
      });
      setFeedback(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStatusChange(
    application: JobApplication,
    status: JobApplication["status"]
  ) {
    if (application.status === status || updatingId) return;

    setUpdatingId(application.id);
    setFeedback(null);

    try {
      const data = await updateApplication(application.id, { status });
      setLatestResult({
        status: 200,
        body: { data },
        success: true,
        message: "Status updated successfully.",
      });
      setFeedback("Status updated successfully.");
      await loadRecords();
    } catch (err) {
      const message =
        err instanceof JobFindApiError
          ? err.message
          : "Failed to update status.";
      setLatestResult({
        status: err instanceof JobFindApiError ? err.status : 500,
        body: {
          error: {
            code: err instanceof JobFindApiError ? err.code : "DATABASE_ERROR",
            message,
          },
        },
        success: false,
        message,
      });
      setFeedback(message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    try {
      await deleteApplication(deleteTarget.id);
      setLatestResult({
        status: 200,
        body: { success: true },
        success: true,
        message: "Record deleted successfully.",
      });
      setFeedback("Record deleted successfully.");
      setDeleteTarget(null);
      await loadRecords();
    } catch (err) {
      const message =
        err instanceof JobFindApiError
          ? err.message
          : "Failed to delete record.";
      setLatestResult({
        status: err instanceof JobFindApiError ? err.status : 500,
        body: {
          error: {
            code: err instanceof JobFindApiError ? err.code : "DATABASE_ERROR",
            message,
          },
        },
        success: false,
        message,
      });
      setFeedback(message);
      throw err;
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-5">
        <h2 className="text-lg font-semibold tracking-tight">Input</h2>
        <ApplicationFormFields form={form} onChange={setForm} idPrefix="test-" />

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleCreate}
            disabled={
              isCreating || !form.company.trim() || !form.position.trim()
            }
            className="gap-2"
          >
            {isCreating && <Loader2 className="size-4 animate-spin" />}
            Create Test Record
          </Button>
          <Button variant="outline" onClick={handleClearForm} disabled={isCreating}>
            Clear Form
          </Button>
          <Button
            variant="outline"
            onClick={() => void loadRecords()}
            disabled={isLoadingRecords}
            className="gap-2"
          >
            {isLoadingRecords ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Load All Records
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/60 bg-card/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Result</h2>
          <p className="text-sm text-muted-foreground">
            Total records: {records.length}
          </p>
        </div>

        {feedback && (
          <p
            className={
              latestResult?.success
                ? "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
                : "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            }
          >
            {feedback}
            {latestResult && !latestResult.success && (
              <span className="mt-1 block text-xs opacity-80">
                Status code: {latestResult.status}
              </span>
            )}
          </p>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Latest API response</p>
          <pre className="max-h-56 overflow-auto rounded-lg border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
            {latestResult
              ? JSON.stringify(
                  { status: latestResult.status, body: latestResult.body },
                  null,
                  2
                )
              : "No requests yet."}
          </pre>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">All records</p>

          {isLoadingRecords ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading records...
            </div>
          ) : records.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
              No records found.
            </p>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className="space-y-3 rounded-lg border border-border/60 bg-background/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {record.position} at {record.company}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDisplayDate(record.dateApplied)} ·{" "}
                      {statusLabels[record.status]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedId((current) =>
                          current === record.id ? null : record.id
                        )
                      }
                    >
                      View JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditTarget(record)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(record)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusSelect
                    value={record.status}
                    onValueChange={(status) =>
                      void handleStatusChange(record, status)
                    }
                    disabled={updatingId === record.id}
                  />
                </div>

                {record.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {record.requiredSkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                {expandedId === record.id && (
                  <pre className="overflow-auto rounded-lg border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
                    {JSON.stringify(record, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <ApplicationEditDialog
        application={editTarget}
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onSaved={async () => {
          setFeedback("Record updated successfully.");
          await loadRecords();
        }}
      />

      {deleteTarget && (
        <DeleteApplicationDialog
          company={deleteTarget.company}
          position={deleteTarget.position}
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

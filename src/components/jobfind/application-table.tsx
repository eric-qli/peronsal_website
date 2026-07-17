"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Loader2,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { ApplicationEditDialog } from "@/components/jobfind/application-edit-dialog";
import { DeleteApplicationDialog } from "@/components/jobfind/delete-application-dialog";
import { StatusSelect } from "@/components/jobfind/status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteApplication,
  getApplications,
  JobFindApiError,
  updateApplication,
} from "@/lib/jobfind/api";
import {
  sortOptions,
  statusFilterOptions,
  statusLabels,
  type ApplicationStatus,
  type JobApplication,
  type SortOption,
  type StatusFilter,
} from "@/lib/jobfind/types";
import { formatDisplayDate } from "@/lib/jobfind/utils";

interface ApplicationTableProps {
  onMutation?: () => void;
  refreshKey?: number;
}

export function ApplicationTable({
  onMutation,
  refreshKey = 0,
}: ApplicationTableProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobApplication | null>(null);
  const [editTarget, setEditTarget] = useState<JobApplication | null>(null);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getApplications({
        status: statusFilter,
        search,
        sort: sortBy,
      });
      setApplications(data);
    } catch (err) {
      setError(
        err instanceof JobFindApiError
          ? err.message
          : "Failed to load applications."
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, sortBy, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadApplications();
    }, search ? 250 : 0);

    return () => clearTimeout(timeout);
  }, [loadApplications, refreshKey, search]);

  async function handleStatusChange(
    application: JobApplication,
    status: ApplicationStatus
  ) {
    if (application.status === status || updatingId) return;

    setUpdatingId(application.id);
    setError(null);

    try {
      await updateApplication(application.id, { status });
      await loadApplications();
      onMutation?.();
    } catch (err) {
      setError(
        err instanceof JobFindApiError
          ? err.message
          : "Failed to update application status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    await deleteApplication(deleteTarget.id);
    setDeleteTarget(null);
    await loadApplications();
    onMutation?.();
  }

  const emptyMessage =
    search || statusFilter !== "all"
      ? "No applications match your filters."
      : "No applications yet. Add one from the Input page.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search applications..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-full min-w-[140px] sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilterOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All Statuses" : statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger className="w-full min-w-[180px] sm:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading applications...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Company</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Date Applied</TableHead>
                <TableHead className="hidden lg:table-cell">Required Skills</TableHead>
                <TableHead className="hidden xl:table-cell">Source URL</TableHead>
                <TableHead className="hidden 2xl:table-cell">Notes</TableHead>
                <TableHead className="w-[96px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.company}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground">
                      {app.position}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {app.location ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusSelect
                        value={app.status}
                        onValueChange={(status) =>
                          void handleStatusChange(app, status)
                        }
                        disabled={updatingId === app.id}
                      />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDisplayDate(app.dateApplied)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {app.requiredSkills.length > 0 ? (
                          app.requiredSkills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {app.sourceUrl ? (
                        <a
                          href={app.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-[220px] items-center gap-1 truncate text-sm text-accent hover:underline"
                        >
                          <ExternalLink className="size-3 shrink-0" />
                          {app.sourceUrl.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-muted-foreground 2xl:table-cell">
                      {app.notes ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditTarget(app)}
                          aria-label={`Edit ${app.company} application`}
                        >
                          <Pencil className="size-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(app)}
                          aria-label={`Delete ${app.company} application`}
                        >
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          Showing {applications.length} application
          {applications.length === 1 ? "" : "s"}
        </p>
      )}

      <ApplicationEditDialog
        application={editTarget}
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onSaved={async () => {
          await loadApplications();
          onMutation?.();
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
    </motion.div>
  );
}

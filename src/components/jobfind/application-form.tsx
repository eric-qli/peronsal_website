"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createApplication, JobFindApiError } from "@/lib/jobfind/api";
import {
  applicationStatuses,
  statusLabels,
  type ApplicationStatus,
  type CreateJobApplicationInput,
} from "@/lib/jobfind/types";
import {
  getTodayDateString,
  skillsArrayToInput,
  skillsInputToArray,
} from "@/lib/jobfind/utils";

export interface ApplicationFormValues {
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  dateApplied: string;
  requiredSkills: string;
  sourceUrl: string;
  notes: string;
}

interface ApplicationFormProps {
  onSuccess?: () => void;
  submitLabel?: string;
  showSummaryLink?: boolean;
  initialValues?: Partial<ApplicationFormValues>;
  resetOnSuccess?: boolean;
}

export function createEmptyFormValues(): ApplicationFormValues {
  return {
    company: "",
    position: "",
    location: "",
    status: "applied",
    dateApplied: getTodayDateString(),
    requiredSkills: "",
    sourceUrl: "",
    notes: "",
  };
}

export function applicationToFormValues(
  application: CreateJobApplicationInput & { requiredSkills?: string[] }
): ApplicationFormValues {
  return {
    company: application.company ?? "",
    position: application.position ?? "",
    location: application.location ?? "",
    status: application.status ?? "applied",
    dateApplied: application.dateApplied ?? getTodayDateString(),
    requiredSkills: skillsArrayToInput(application.requiredSkills ?? []),
    sourceUrl: application.sourceUrl ?? "",
    notes: application.notes ?? "",
  };
}

interface ApplicationFormFieldsProps {
  form: ApplicationFormValues;
  onChange: (form: ApplicationFormValues) => void;
  idPrefix?: string;
}

export function ApplicationFormFields({
  form,
  onChange,
  idPrefix = "",
}: ApplicationFormFieldsProps) {
  function updateField<K extends keyof ApplicationFormValues>(
    key: K,
    value: ApplicationFormValues[K]
  ) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}company`}>Company *</Label>
          <Input
            id={`${idPrefix}company`}
            value={form.company}
            onChange={(event) => updateField("company", event.target.value)}
            placeholder="Acme Inc."
            required
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}position`}>Position *</Label>
          <Input
            id={`${idPrefix}position`}
            value={form.position}
            onChange={(event) => updateField("position", event.target.value)}
            placeholder="Software Engineer"
            required
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}location`}>Location</Label>
          <Input
            id={`${idPrefix}location`}
            value={form.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder="Remote"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}status`}>Status</Label>
          <Select
            value={form.status}
            onValueChange={(value) =>
              updateField("status", value as ApplicationStatus)
            }
          >
            <SelectTrigger id={`${idPrefix}status`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {applicationStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}dateApplied`}>Date Applied *</Label>
          <Input
            id={`${idPrefix}dateApplied`}
            type="date"
            value={form.dateApplied}
            onChange={(event) => updateField("dateApplied", event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}sourceUrl`}>Source URL</Label>
          <Input
            id={`${idPrefix}sourceUrl`}
            type="url"
            value={form.sourceUrl}
            onChange={(event) => updateField("sourceUrl", event.target.value)}
            placeholder="https://company.com/careers/job-id"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}requiredSkills`}>Required Skills</Label>
        <Input
          id={`${idPrefix}requiredSkills`}
          value={form.requiredSkills}
          onChange={(event) =>
            updateField("requiredSkills", event.target.value)
          }
          placeholder="React, TypeScript, Node.js"
        />
        <p className="text-xs text-muted-foreground">Comma-separated values</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}notes`}>Notes</Label>
        <Textarea
          id={`${idPrefix}notes`}
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Referral, recruiter contact, follow-up reminders..."
          className="min-h-[96px] resize-y"
        />
      </div>
    </div>
  );
}

export function ApplicationForm({
  onSuccess,
  submitLabel = "Save Application",
  showSummaryLink = false,
  initialValues,
  resetOnSuccess = true,
}: ApplicationFormProps) {
  const [form, setForm] = useState<ApplicationFormValues>({
    ...createEmptyFormValues(),
    ...initialValues,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      const timeout = setTimeout(() => {
        setForm({ ...createEmptyFormValues(), ...initialValues });
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [initialValues]);

  function handleFormChange(next: ApplicationFormValues) {
    setForm(next);
    setSuccessMessage(null);
    setError(null);
  }

  function handleClear() {
    setForm(createEmptyFormValues());
    setError(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const payload: CreateJobApplicationInput = {
      company: form.company,
      position: form.position,
      location: form.location,
      status: form.status,
      dateApplied: form.dateApplied,
      requiredSkills: skillsInputToArray(form.requiredSkills),
      sourceUrl: form.sourceUrl,
      notes: form.notes,
    };

    try {
      await createApplication(payload);

      if (resetOnSuccess) {
        setForm(createEmptyFormValues());
      }

      setSuccessMessage("Application saved successfully.");
      onSuccess?.();
    } catch (err) {
      if (err instanceof JobFindApiError) {
        setError(err.message);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to save application."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ApplicationFormFields form={form} onChange={handleFormChange} />

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {successMessage && (
        <div className="space-y-2">
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {successMessage}
          </p>
          {showSummaryLink && (
            <Link
              href="/jobfind/summary"
              className="text-sm text-accent hover:underline"
            >
              View on Summary page →
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || !form.company.trim() || !form.position.trim()}
          size="lg"
          className="gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {submitLabel}
        </Button>
        <Button
          type="button"
          onClick={handleClear}
          disabled={isSubmitting}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Trash2 className="size-4" />
          Clear
        </Button>
      </div>
    </form>
  );
}

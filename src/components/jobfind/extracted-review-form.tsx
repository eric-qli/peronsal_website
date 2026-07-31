"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
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
  reviewFormToCreateInput,
  type ExtractedReviewFormValues,
} from "@/lib/jobfind/extraction-mapper";
import {
  applicationStatuses,
  statusLabels,
  type ApplicationStatus,
} from "@/lib/jobfind/types";

interface ExtractedReviewFormProps {
  initialValues: ExtractedReviewFormValues;
  onSaved: () => void;
  onClear: () => void;
}

export function ExtractedReviewForm({
  initialValues,
  onSaved,
  onClear,
}: ExtractedReviewFormProps) {
  const [form, setForm] = useState(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setForm(initialValues);
      setError(null);
      setSuccessMessage(null);
    }, 0);
    return () => clearTimeout(timeout);
  }, [initialValues]);

  function updateField<K extends keyof ExtractedReviewFormValues>(
    key: K,
    value: ExtractedReviewFormValues[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
    setSuccessMessage(null);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    if (!form.company.trim() || !form.position.trim()) {
      setError("Company and position are required before saving.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await createApplication(reviewFormToCreateInput(form));
      setSuccessMessage("Application saved successfully.");
      onSaved();
    } catch (err) {
      setError(
        err instanceof JobFindApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to save application."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="review-company">Company *</Label>
          <Input
            id="review-company"
            value={form.company}
            onChange={(event) => updateField("company", event.target.value)}
            required
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-position">Position *</Label>
          <Input
            id="review-position"
            value={form.position}
            onChange={(event) => updateField("position", event.target.value)}
            required
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-location">Location</Label>
          <Input
            id="review-location"
            value={form.location}
            onChange={(event) => updateField("location", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-status">Status</Label>
          <Select
            value={form.status ?? "applied"}
            onValueChange={(value) =>
              updateField("status", value as ApplicationStatus)
            }
          >
            <SelectTrigger id="review-status" className="w-full">
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
          <Label htmlFor="review-dateApplied">Date Applied *</Label>
          <Input
            id="review-dateApplied"
            type="date"
            value={form.dateApplied}
            onChange={(event) => updateField("dateApplied", event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-sourceUrl">Source URL</Label>
          <Input
            id="review-sourceUrl"
            type="url"
            value={form.sourceUrl}
            onChange={(event) => updateField("sourceUrl", event.target.value)}
            placeholder="https://company.com/careers/job-id"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-employmentType">Employment Type</Label>
          <Input
            id="review-employmentType"
            value={form.employmentType}
            onChange={(event) =>
              updateField("employmentType", event.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-experienceLevel">Experience Level</Label>
          <Input
            id="review-experienceLevel"
            value={form.experienceLevel}
            onChange={(event) =>
              updateField("experienceLevel", event.target.value)
            }
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="review-salaryMin">Salary Min</Label>
          <Input
            id="review-salaryMin"
            value={form.salaryMin}
            onChange={(event) => updateField("salaryMin", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-salaryMax">Salary Max</Label>
          <Input
            id="review-salaryMax"
            value={form.salaryMax}
            onChange={(event) => updateField("salaryMax", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-currency">Currency</Label>
          <Input
            id="review-currency"
            value={form.currency}
            onChange={(event) => updateField("currency", event.target.value)}
            placeholder="USD"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-requiredSkills">Required Skills</Label>
        <Input
          id="review-requiredSkills"
          value={form.requiredSkills}
          onChange={(event) =>
            updateField("requiredSkills", event.target.value)
          }
          placeholder="React, TypeScript, Node.js"
        />
        <p className="text-xs text-muted-foreground">Comma-separated values</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-preferredSkills">Preferred Skills</Label>
        <Input
          id="review-preferredSkills"
          value={form.preferredSkills}
          onChange={(event) =>
            updateField("preferredSkills", event.target.value)
          }
          placeholder="AWS, Docker"
        />
        <p className="text-xs text-muted-foreground">Comma-separated values</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-responsibilities">Responsibilities</Label>
        <Textarea
          id="review-responsibilities"
          value={form.responsibilities}
          onChange={(event) =>
            updateField("responsibilities", event.target.value)
          }
          className="min-h-[120px] resize-y"
          placeholder="One responsibility per line"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-qualifications">Qualifications</Label>
        <Textarea
          id="review-qualifications"
          value={form.qualifications}
          onChange={(event) =>
            updateField("qualifications", event.target.value)
          }
          className="min-h-[120px] resize-y"
          placeholder="One qualification per line"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-notes">Notes</Label>
        <Textarea
          id="review-notes"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Additional notes, referral details, follow-up reminders..."
          className="min-h-[96px] resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Employment type, experience level, preferred skills, responsibilities,
          qualifications, and salary details are saved into notes automatically.
        </p>
      </div>

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
          <Link
            href="/jobfind/summary"
            className="text-sm text-accent hover:underline"
          >
            View on Summary page →
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={isSaving || !form.company.trim() || !form.position.trim()}
          size="lg"
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Application
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onClear}
          disabled={isSaving}
        >
          Clear Review
        </Button>
      </div>
    </form>
  );
}

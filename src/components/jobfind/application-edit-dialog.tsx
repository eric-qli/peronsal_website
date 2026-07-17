"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  ApplicationFormFields,
  applicationToFormValues,
  type ApplicationFormValues,
} from "@/components/jobfind/application-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JobFindApiError, updateApplication } from "@/lib/jobfind/api";
import { type JobApplication } from "@/lib/jobfind/types";
import { skillsInputToArray } from "@/lib/jobfind/utils";

interface ApplicationEditDialogProps {
  application: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function ApplicationEditDialog({
  application,
  open,
  onOpenChange,
  onSaved,
}: ApplicationEditDialogProps) {
  const [form, setForm] = useState<ApplicationFormValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (application) {
      const timeout = setTimeout(() => {
        setForm(applicationToFormValues(application));
        setError(null);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [application]);

  async function handleSave() {
    if (!application || !form || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateApplication(application.id, {
        company: form.company,
        position: form.position,
        location: form.location,
        status: form.status,
        dateApplied: form.dateApplied,
        requiredSkills: skillsInputToArray(form.requiredSkills),
        sourceUrl: form.sourceUrl,
        notes: form.notes,
      });

      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof JobFindApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to update application."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit application</DialogTitle>
          <DialogDescription>
            Update fields for {application?.company ?? "this application"}.
          </DialogDescription>
        </DialogHeader>

        {form && (
          <ApplicationFormFields
            form={form}
            onChange={setForm}
            idPrefix="edit-"
          />
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            <Save className="size-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { ExtractedReviewForm } from "@/components/jobfind/extracted-review-form";
import { RecentInputs } from "@/components/jobfind/recent-inputs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractJobDescription, JobFindApiError } from "@/lib/jobfind/api";
import {
  extractedJobToReviewForm,
  type ExtractedReviewFormValues,
} from "@/lib/jobfind/extraction-mapper";

const MAX_CHARACTERS = 10000;

export function InputPageContent() {
  const [jobDescription, setJobDescription] = useState("");
  const [reviewForm, setReviewForm] = useState<ExtractedReviewFormValues | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  const characterCount = jobDescription.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;

  function handleClearJobDescription() {
    setJobDescription("");
    setExtractError(null);
    setSavedSuccessfully(false);
  }

  function handleClearReview() {
    setReviewForm(null);
    setSavedSuccessfully(false);
  }

  async function handleExtract() {
    const trimmed = jobDescription.trim();

    if (!trimmed) {
      setExtractError("Job description cannot be empty.");
      return;
    }

    if (isOverLimit || isExtracting) return;

    setIsExtracting(true);
    setExtractError(null);
    setSavedSuccessfully(false);

    try {
      const result = await extractJobDescription(trimmed);
      setReviewForm(extractedJobToReviewForm(result.data));
    } catch (err) {
      setReviewForm(null);
      setExtractError(
        err instanceof JobFindApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to extract job information."
      );
    } finally {
      setIsExtracting(false);
    }
  }

  function handleSaved() {
    setJobDescription("");
    setReviewForm(null);
    setExtractError(null);
    setSavedSuccessfully(true);
    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Job Description Input
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Paste a job description, extract structured information, review the
          results, and save the application.
        </p>
      </header>

      {savedSuccessfully && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Application saved. Open the Summary page to manage its status.
        </p>
      )}

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">
            1. Paste Job Description
          </h2>
          <p className="text-sm text-muted-foreground">
            Paste the full job description below, then extract structured fields.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="space-y-4"
        >
          <div className="relative">
            <Textarea
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value);
                setExtractError(null);
                setSavedSuccessfully(false);
              }}
              placeholder="Paste a job description here..."
              className="min-h-[280px] resize-y text-base leading-relaxed md:min-h-[320px]"
              aria-label="Job description input"
            />
            <div className="absolute right-3 bottom-3 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              <span className={isOverLimit ? "text-destructive" : undefined}>
                {characterCount.toLocaleString()}
              </span>
              <span> / {MAX_CHARACTERS.toLocaleString()}</span>
            </div>
          </div>

          {extractError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {extractError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleExtract}
              disabled={!jobDescription.trim() || isOverLimit || isExtracting}
              size="lg"
              className="gap-2"
            >
              {isExtracting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Extract Information
            </Button>
            <Button
              onClick={handleClearJobDescription}
              disabled={!jobDescription || isExtracting}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Trash2 className="size-4" />
              Clear
            </Button>
          </div>
        </motion.div>
      </section>

      {reviewForm && (
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">
              2. Review and Save
            </h2>
            <p className="text-sm text-muted-foreground">
              Review the extracted fields, edit anything that looks wrong, then
              save the application.
            </p>
          </div>

          <ExtractedReviewForm
            initialValues={reviewForm}
            onSaved={handleSaved}
            onClear={handleClearReview}
          />
        </section>
      )}

      <RecentInputs refreshKey={refreshKey} />
    </div>
  );
}

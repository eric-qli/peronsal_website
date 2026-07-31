"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { CountryFormatSwitch } from "@/components/jobfind/country-format-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobFindApiError } from "@/lib/jobfind/api";
import {
  inferCoverLetterCountry,
  type CoverLetterCountry,
} from "@/lib/jobfind/cover-letter";
import { getFilenameFromContentDisposition } from "@/lib/jobfind/cover-letter-filename";

interface CoverLetterSectionProps {
  applicationId: string;
  location: string | null;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function CoverLetterSection({
  applicationId,
  location,
}: CoverLetterSectionProps) {
  const [format, setFormat] = useState<CoverLetterCountry>(() =>
    inferCoverLetterCountry(location)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleGenerate() {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `/api/jobfind/applications/${applicationId}/cover-letter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: format }),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        let message = "The cover letter could not be generated. Please try again.";

        try {
          const payload = (await response.json()) as {
            error?: { message?: string };
          };
          if (payload.error?.message) {
            message = payload.error.message;
          }
        } catch {
          // Keep generic message when the error body is not JSON.
        }

        throw new JobFindApiError(
          message,
          "COVER_LETTER_GENERATION_FAILED",
          response.status
        );
      }

      const blob = await response.blob();
      const filename =
        getFilenameFromContentDisposition(
          response.headers.get("Content-Disposition")
        ) ?? "cover-letter.pdf";

      triggerBlobDownload(blob, filename);
      setSuccessMessage("Cover letter downloaded.");
    } catch (err) {
      setError(
        err instanceof JobFindApiError
          ? err.message
          : "The cover letter could not be generated. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Cover Letter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CountryFormatSwitch value={format} onChange={setFormat} />

        {format === "usa" ? (
          <p className="text-sm text-muted-foreground">
            The USA version includes a TN work-authorization paragraph. Review
            the generated letter before submitting it.
          </p>
        ) : null}

        <p className="text-sm text-muted-foreground">
          Generating a cover letter sends the current job details and my resume
          content to OpenAI.
        </p>

        <div className="space-y-2">
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={isGenerating}
            onClick={() => void handleGenerate()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating Cover Letter...
              </>
            ) : (
              "Generate & Download Cover Letter"
            )}
          </Button>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          {successMessage ? (
            <p className="text-sm text-emerald-300">{successMessage}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

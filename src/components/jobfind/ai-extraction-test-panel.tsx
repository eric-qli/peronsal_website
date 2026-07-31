"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type JobExtractionResult } from "@/lib/openai/schema";

interface ExtractionMeta {
  processingTimeMs: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

function JsonDisplay({ data }: { data: JobExtractionResult }) {
  const formatted = JSON.stringify(data, null, 2);

  return (
    <pre className="overflow-auto rounded-lg border border-border/60 bg-background/80 p-4 text-sm leading-relaxed">
      <code className="font-mono text-emerald-100">{formatted}</code>
    </pre>
  );
}

export function AiExtractionTestPanel() {
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<JobExtractionResult | null>(null);
  const [meta, setMeta] = useState<ExtractionMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const characterCount = jobDescription.length;

  function handleClear() {
    setJobDescription("");
    setResult(null);
    setMeta(null);
    setError(null);
    setErrorCode(null);
  }

  async function handleExtract() {
    const trimmed = jobDescription.trim();

    if (!trimmed) {
      setError("Job description cannot be empty.");
      setErrorCode("VALIDATION_ERROR");
      setResult(null);
      setMeta(null);
      return;
    }

    if (isExtracting) return;

    setIsExtracting(true);
    setError(null);
    setErrorCode(null);
    setResult(null);
    setMeta(null);

    try {
      const response = await fetch("/api/jobfind/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: trimmed }),
      });

      const payload = (await response.json()) as
        | { data: JobExtractionResult; meta: ExtractionMeta }
        | ApiErrorResponse;

      if (!response.ok) {
        const errorPayload = payload as ApiErrorResponse;
        setError(errorPayload.error?.message ?? "Extraction failed.");
        setErrorCode(errorPayload.error?.code ?? "OPENAI");
        return;
      }

      const successPayload = payload as {
        data: JobExtractionResult;
        meta: ExtractionMeta;
      };

      setResult(successPayload.data);
      setMeta(successPayload.meta);
    } catch {
      setError("Network error. Check your connection and try again.");
      setErrorCode("NETWORK_ERROR");
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Job Description</h2>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="space-y-4"
        >
          <div className="relative">
            <Textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste a job description here..."
              className="min-h-[320px] resize-y text-base leading-relaxed md:min-h-[380px]"
              aria-label="Job description input"
            />
            <div className="absolute right-3 bottom-3 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              {characterCount.toLocaleString()} characters
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleExtract}
              disabled={isExtracting || !jobDescription.trim()}
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
              onClick={handleClear}
              disabled={isExtracting || !jobDescription}
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

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Extraction Result</h2>

        {isExtracting && (
          <div className="flex h-48 items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/40 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Extracting job information...
          </div>
        )}

        {!isExtracting && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-4">
            <p className="font-medium text-destructive">{error}</p>
            {errorCode && (
              <p className="mt-1 text-sm text-muted-foreground">
                Error code: {errorCode}
              </p>
            )}
          </div>
        )}

        {!isExtracting && !error && !result && (
          <p className="rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
            Paste a job description and click Extract Information to see structured
            JSON here.
          </p>
        )}

        {!isExtracting && result && (
          <div className="space-y-4">
            <JsonDisplay data={result} />

            {meta && (
              <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Developer info</p>
                <ul className="mt-2 space-y-1">
                  <li>Processing time: {meta.processingTimeMs} ms</li>
                  <li>Approximate input tokens: {meta.inputTokens}</li>
                  <li>Approximate output tokens: {meta.outputTokens}</li>
                  <li>Model: {meta.model}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

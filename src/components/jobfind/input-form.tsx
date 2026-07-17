"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function InputForm() {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmed = value.trim();
  const isValid = trimmed.length > 0 && isValidUrl(trimmed);
  const showError = touched && trimmed.length > 0 && !isValid;

  function handleClear() {
    setValue("");
    setTouched(false);
  }

  function handleExtract() {
    setTouched(true);
    if (!isValid) return;
    // Phase 1: placeholder for future AI integration
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <div className="relative">
          <Link2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="https://company.com/careers/job-id"
            className={cn(
              "h-12 pl-10 text-base",
              showError && "border-destructive ring-destructive/20"
            )}
            aria-label="Job listing URL"
            aria-invalid={showError}
          />
        </div>
        {showError && (
          <p className="text-sm text-destructive">
            Enter a valid URL starting with http:// or https://
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleExtract}
          disabled={!isValid}
          size="lg"
          className="gap-2"
        >
          <Sparkles className="size-4" />
          Extract Information
        </Button>
        <Button
          onClick={handleClear}
          disabled={!value}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <Trash2 className="size-4" />
          Clear
        </Button>
      </div>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ApplicationForm } from "@/components/jobfind/application-form";
import { RecentInputs } from "@/components/jobfind/recent-inputs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function InputPageContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Job Description Input
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Paste a job description below to extract useful information, or enter
          application details manually.
        </p>
      </header>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Job Description
          </h2>
          <p className="text-sm text-muted-foreground">
            JD extraction is coming in a later phase.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="space-y-4"
        >
          <Textarea
            disabled
            placeholder="Paste a job description here..."
            className="min-h-[180px] resize-y text-base leading-relaxed opacity-70 md:min-h-[220px]"
            aria-label="Job description input (disabled)"
          />
          <Button disabled size="lg" className="gap-2">
            <Sparkles className="size-4" />
            Extract Information
          </Button>
        </motion.div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Manual Application Entry
          </h2>
          <p className="text-sm text-muted-foreground">
            Save an application directly to your Supabase database.
          </p>
        </div>
        <ApplicationForm
          showSummaryLink
          onSuccess={() => setRefreshKey((current) => current + 1)}
        />
      </section>

      <RecentInputs refreshKey={refreshKey} />
    </div>
  );
}

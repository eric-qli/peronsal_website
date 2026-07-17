"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_CHARACTERS = 10000;

export function InputForm() {
  const [value, setValue] = useState("");

  const characterCount = value.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;

  function handleClear() {
    setValue("");
  }

  function handleExtract() {
    // Phase 1: placeholder for future AI integration
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="space-y-4"
    >
      <div className="relative">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
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

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleExtract}
          disabled={!value.trim() || isOverLimit}
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

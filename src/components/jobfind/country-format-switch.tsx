"use client";

import { type CoverLetterCountry } from "@/lib/jobfind/cover-letter";
import { cn } from "@/lib/utils";

interface CountryFormatSwitchProps {
  value: CoverLetterCountry;
  onChange: (value: CoverLetterCountry) => void;
}

const options: Array<{ value: CoverLetterCountry; label: string }> = [
  { value: "canada", label: "Canada" },
  { value: "usa", label: "USA" },
];

export function CountryFormatSwitch({
  value,
  onChange,
}: CountryFormatSwitchProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">
        Cover letter format
      </legend>
      <div
        role="radiogroup"
        aria-label="Cover letter format"
        className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-1"
      >
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSelected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientBorder({ children, className }: GradientBorderProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative rounded-2xl p-px",
        reducedMotion
          ? "bg-border/60"
          : "bg-gradient-to-r from-indigo-500/40 via-violet-500/30 to-cyan-500/40 animate-gradient-border",
        className
      )}
    >
      <div className="rounded-[calc(var(--radius-2xl)-1px)] bg-card/80 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}

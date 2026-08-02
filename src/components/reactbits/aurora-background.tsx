"use client";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface AuroraBackgroundProps {
  className?: string;
}

export function AuroraBackground({ className }: AuroraBackgroundProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className={cn(
          "absolute -top-1/2 -left-1/4 size-[900px] rounded-full bg-indigo-500/20 blur-[120px]",
          !reducedMotion && "animate-aurora-drift"
        )}
      />
      <div
        className={cn(
          "absolute top-1/4 -right-1/4 size-[700px] rounded-full bg-violet-500/15 blur-[100px]",
          !reducedMotion && "animate-aurora-drift-reverse"
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 left-1/3 size-[600px] rounded-full bg-cyan-500/10 blur-[90px]",
          !reducedMotion && "animate-aurora-float"
        )}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.28),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(129,140,248,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(129,140,248,0.05)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_78%)]" />
    </div>
  );
}

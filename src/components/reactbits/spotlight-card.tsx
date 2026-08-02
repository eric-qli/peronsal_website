"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  if (reducedMotion) {
    return (
      <div className={cn("rounded-2xl border border-border/60 bg-card/70", className)}>
        {children}
      </div>
    );
  }

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
    const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -8;

    setSpotlight({ x, y, opacity: 1 });
    setTilt({ rotateX, rotateY });
  };

  const onLeave = () => {
    setSpotlight((current) => ({ ...current, opacity: 0 }));
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        transformPerspective: 1000,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm transition-shadow duration-300 hover:border-primary/35 hover:shadow-[0_24px_80px_-24px_rgba(99,102,241,0.45)]",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          opacity: spotlight.opacity,
          background: `radial-gradient(400px circle at ${spotlight.x}% ${spotlight.y}%, rgba(99,102,241,0.14), transparent 55%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          opacity: spotlight.opacity * 0.8,
          background: `radial-gradient(300px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.06), transparent 50%)`,
        }}
      />
      {children}
    </motion.div>
  );
}

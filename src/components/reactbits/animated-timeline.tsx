"use client";

import { motion } from "framer-motion";
import { DURATION, EASE } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface AnimatedTimelineProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedTimeline({ children, className }: AnimatedTimelineProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={cn("relative", className)}>
      <motion.div
        aria-hidden
        className="absolute top-0 bottom-0 left-[7px] hidden w-px origin-top bg-gradient-to-b from-indigo-400/20 via-violet-400/40 to-cyan-400/20 md:block"
        initial={reducedMotion ? false : { scaleY: 0 }}
        whileInView={reducedMotion ? undefined : { scaleY: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: DURATION.slower, ease: EASE }}
      />
      {children}
    </div>
  );
}

interface TimelineItemProps {
  children: React.ReactNode;
  className?: string;
  index: number;
}

export function TimelineItem({ children, className, index }: TimelineItemProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: DURATION.normal, delay: index * 0.12, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

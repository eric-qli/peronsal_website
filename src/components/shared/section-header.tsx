"use client";

import { motion } from "framer-motion";
import { DURATION, EASE, VIEWPORT } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label: string;
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeader({
  label,
  title,
  description,
  className,
}: SectionHeaderProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div className={cn("mb-12 md:mb-16", className)}>
        <p className="mb-4 text-base font-semibold tracking-widest text-indigo-300 uppercase md:text-lg">
          {label}
        </p>
        <h2 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {title}
        </h2>
        {description && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {description}
          </p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.1 },
        },
      }}
      className={cn("mb-12 md:mb-16", className)}
    >
      <motion.p
        variants={{
          hidden: { opacity: 0, y: 16 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: DURATION.normal, ease: EASE },
          },
        }}
        className="mb-4 text-base font-semibold tracking-widest text-indigo-300 uppercase md:text-lg"
      >
        {label}
      </motion.p>
      <motion.h2
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: DURATION.normal, ease: EASE },
          },
        }}
        className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: DURATION.normal, ease: EASE },
            },
          }}
          className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { fadeUpVariants, VIEWPORT } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}

export function ScrollReveal({
  children,
  className,
  id,
  delay = 0,
}: ScrollRevealProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <section id={id} className={cn("scroll-mt-24", className)}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{
        hidden: fadeUpVariants.hidden,
        visible: {
          ...fadeUpVariants.visible,
          transition: {
            ...(fadeUpVariants.visible as { transition: object }).transition,
            delay,
          },
        },
      }}
      className={cn("scroll-mt-28", className)}
    >
      {children}
    </motion.section>
  );
}

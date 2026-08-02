"use client";

import { motion } from "framer-motion";
import { DURATION, EASE, STAGGER } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface RevealTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "p" | "h1" | "h2" | "h3" | "span" | "div";
}

export function RevealText({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: RevealTextProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, delay, ease: EASE }}
      className={cn(className, Tag === "div" ? undefined : "contents")}
    >
      {Tag === "div" ? children : <Tag className={className}>{children}</Tag>}
    </motion.div>
  );
}

interface RevealGroupProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function RevealGroup({ children, className, delay = 0 }: RevealGroupProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: STAGGER.normal, delayChildren: delay },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: DURATION.normal, ease: EASE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

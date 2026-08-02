"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function MagneticButton({ children, className }: MagneticButtonProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;

    setTransform({ x: x * 0.15, y: y * 0.15 });
  };

  const onLeave = () => setTransform({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      className={cn("inline-flex", className)}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      animate={{ x: transform.x, y: transform.y }}
      transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

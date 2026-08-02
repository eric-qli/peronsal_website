import { type Variants } from "framer-motion";

export const EASE = [0.21, 0.47, 0.32, 0.98] as const;

export const DURATION = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.7,
  slower: 0.9,
} as const;

export const STAGGER = {
  tight: 0.06,
  normal: 0.1,
  loose: 0.15,
} as const;

export const VIEWPORT = {
  once: true,
  margin: "-80px" as const,
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE },
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.normal, ease: EASE },
  },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.normal, ease: EASE },
  },
};

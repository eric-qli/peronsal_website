"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/lib/data";
import { DURATION, EASE, VIEWPORT } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function Footer() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <footer className="border-t border-indigo-400/20 bg-card/40 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-base text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-base text-muted-foreground">
            Built with Next.js, Tailwind CSS & Framer Motion
          </p>
        </div>
      </footer>
    );
  }

  return (
    <motion.footer
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.normal, ease: EASE }}
      className="border-t border-indigo-400/20 bg-card/40 py-10"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <p className="text-base text-muted-foreground transition-colors hover:text-foreground/80">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <p className="text-base text-muted-foreground transition-colors hover:text-foreground/80">
          Built with Next.js, Tailwind CSS & Framer Motion
        </p>
      </div>
    </motion.footer>
  );
}

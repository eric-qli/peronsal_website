"use client";

import { motion } from "framer-motion";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeader } from "@/components/shared/section-header";
import { DURATION, EASE } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { aboutContent, educationContent } from "@/lib/data";

export function About() {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatedSection id="about" className="section-tint-indigo py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader label="About" title="Building software that matters" />
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl md:leading-relaxed">
          {aboutContent.paragraph}
        </p>
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: DURATION.normal, ease: EASE, delay: 0.1 }}
          className="mt-8 max-w-3xl rounded-xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm md:p-8"
        >
          <div className="space-y-2 text-base text-muted-foreground md:text-lg">
            <p>
              <span className="font-medium text-foreground">
                {educationContent.degree}
              </span>
              {" · "}
              {educationContent.school}
            </p>
            <p>
              {educationContent.period} · {educationContent.location}
            </p>
            <p>
              Relevant coursework: {educationContent.coursework.join(", ")}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

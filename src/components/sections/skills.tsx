"use client";

import { motion } from "framer-motion";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/shared/animated-section";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { DURATION, EASE } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { skillGroups } from "@/lib/data";
import { cn } from "@/lib/utils";

const categoryColors = [
  "text-indigo-300 border-indigo-400/30 bg-indigo-500/10 hover:border-indigo-400/45 hover:shadow-[0_0_40px_-16px_rgba(99,102,241,0.5)]",
  "text-violet-300 border-violet-400/30 bg-violet-500/10 hover:border-violet-400/45 hover:shadow-[0_0_40px_-16px_rgba(139,92,246,0.5)]",
  "text-cyan-300 border-cyan-400/30 bg-cyan-500/10 hover:border-cyan-400/45 hover:shadow-[0_0_40px_-16px_rgba(34,211,238,0.4)]",
];

function SkillChip({ skill, reducedMotion }: { skill: string; reducedMotion: boolean }) {
  if (reducedMotion) {
    return (
      <Badge
        variant="outline"
        className="border-white/15 bg-white/5 px-3 py-1 text-sm font-normal text-foreground/90 md:text-base"
      >
        {skill}
      </Badge>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.04, y: -1 }} transition={{ duration: 0.2, ease: EASE }}>
      <Badge
        variant="outline"
        className="border-white/15 bg-white/5 px-3 py-1 text-sm font-normal text-foreground/90 transition-colors hover:border-white/30 hover:bg-white/10 md:text-base"
      >
        {skill}
      </Badge>
    </motion.div>
  );
}

export function Skills() {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatedSection id="skills" className="section-tint-cyan py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          label="Skills"
          title="Technologies I work with"
          description="A toolkit built across software engineering, data, and AI."
        />

        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, index) => (
            <StaggerItem key={group.category}>
              <motion.div
                whileHover={reducedMotion ? undefined : { y: -4 }}
                transition={{ duration: DURATION.fast, ease: EASE }}
                className={cn(
                  "h-full rounded-xl border p-6 transition-all duration-300 md:p-8",
                  categoryColors[index % categoryColors.length]
                )}
              >
                <h3 className="mb-5 text-base font-semibold tracking-widest uppercase md:text-lg">
                  {group.category}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {group.skills.map((skill) => (
                    <SkillChip key={skill} skill={skill} reducedMotion={reducedMotion} />
                  ))}
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </AnimatedSection>
  );
}

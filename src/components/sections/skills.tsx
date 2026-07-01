import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/shared/animated-section";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { skillGroups } from "@/lib/data";
import { cn } from "@/lib/utils";

const categoryColors = [
  "text-indigo-300 border-indigo-400/30 bg-indigo-500/10",
  "text-violet-300 border-violet-400/30 bg-violet-500/10",
  "text-cyan-300 border-cyan-400/30 bg-cyan-500/10",
  "text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-500/10",
  "text-sky-300 border-sky-400/30 bg-sky-500/10",
];

export function Skills() {
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
              <div
                className={cn(
                  "h-full rounded-xl border p-6 transition-all duration-300 hover:scale-[1.02] md:p-8",
                  categoryColors[index % categoryColors.length]
                )}
              >
                <h3 className="mb-5 text-base font-semibold tracking-widest uppercase md:text-lg">
                  {group.category}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {group.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="border-white/15 bg-white/5 px-3 py-1 text-sm font-normal text-foreground/90 transition-colors hover:border-white/30 hover:bg-white/10 md:text-base"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </AnimatedSection>
  );
}

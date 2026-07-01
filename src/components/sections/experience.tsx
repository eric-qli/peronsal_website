import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/shared/animated-section";
import { SectionHeader } from "@/components/shared/section-header";
import { experiences } from "@/lib/data";
import { cn } from "@/lib/utils";

const accentColors = [
  "border-l-indigo-400 bg-indigo-500/10 hover:border-indigo-400/50",
  "border-l-violet-400 bg-violet-500/10 hover:border-violet-400/50",
];

const dotColors = [
  "border-indigo-400 bg-indigo-400",
  "border-violet-400 bg-violet-400",
];

const roleColors = ["text-indigo-300", "text-violet-300"];

export function Experience() {
  return (
    <AnimatedSection id="experience" className="section-tint-violet py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          label="Experience"
          title="Where I've worked"
          description="Data engineering and software development roles in banking and telecom."
        />

        <StaggerContainer className="relative">
          <div className="absolute top-0 bottom-0 left-[7px] hidden w-px bg-gradient-to-b from-indigo-400/50 to-violet-400/50 md:block" />

          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <StaggerItem key={`${exp.company}-${exp.role}`}>
                <div className="group relative flex gap-6 md:gap-8">
                  <div
                    className={cn(
                      "relative z-10 mt-2 hidden size-4 shrink-0 rounded-full border-2 md:block",
                      dotColors[index % dotColors.length]
                    )}
                  />

                  <div
                    className={cn(
                      "flex-1 rounded-xl border border-l-4 border-border/60 p-6 transition-all duration-300 md:p-8",
                      accentColors[index % accentColors.length]
                    )}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-xl font-medium text-foreground md:text-2xl">
                          {exp.company}
                        </h3>
                        <p className="mt-1 text-base text-muted-foreground md:text-lg">
                          {exp.location}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <span
                          className={cn(
                            "text-base font-medium md:text-lg",
                            roleColors[index % roleColors.length]
                          )}
                        >
                          {exp.role}
                        </span>
                        <p className="mt-1 text-sm text-muted-foreground md:text-base">
                          {exp.period}
                        </p>
                      </div>
                    </div>

                    <ul className="mt-5 space-y-3">
                      {exp.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="flex gap-3 text-base leading-relaxed text-muted-foreground md:text-lg"
                        >
                          <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-indigo-400/80" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </div>
    </AnimatedSection>
  );
}

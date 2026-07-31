import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeader } from "@/components/shared/section-header";
import { aboutContent, educationContent } from "@/lib/data";

export function About() {
  return (
    <AnimatedSection id="about" className="section-tint-indigo py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader label="About" title="Building software that matters" />
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl md:leading-relaxed">
          {aboutContent.paragraph}
        </p>
        <div className="mt-8 max-w-3xl space-y-2 text-base text-muted-foreground md:text-lg">
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
      </div>
    </AnimatedSection>
  );
}

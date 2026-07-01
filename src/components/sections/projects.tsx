import { AnimatedSection } from "@/components/shared/animated-section";
import { ProjectCard } from "@/components/shared/project-card";
import { SectionHeader } from "@/components/shared/section-header";
import { projects } from "@/lib/data";

export function Projects() {
  return (
    <AnimatedSection id="projects" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          label="Projects"
          title="Featured work"
          description="Full-stack applications spanning AI, finance, and real-time systems."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <ProjectCard key={project.title} {...project} index={index} />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

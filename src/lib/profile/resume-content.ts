import "server-only";

import {
  aboutContent,
  educationContent,
  experiences,
  projects,
  siteConfig,
  skillGroups,
} from "@/lib/data";

export interface ResumeExperience {
  company: string;
  role: string;
  period: string;
  location: string;
  highlights: string[];
}

export interface ResumeProject {
  title: string;
  description: string;
  tags: string[];
}

export interface ResumeContent {
  name: string;
  email: string;
  website: string;
  linkedin: string;
  education: string;
  summary: string;
  experiences: ResumeExperience[];
  projects: ResumeProject[];
  technicalSkills: string[];
}

export function getResumeContent(): ResumeContent {
  return {
    name: siteConfig.name,
    email: siteConfig.email,
    website: "https://ericqli.ca",
    linkedin: siteConfig.links.linkedin,
    education: `${educationContent.degree}, ${educationContent.school} (${educationContent.period}). Relevant coursework: ${educationContent.coursework.join(", ")}`,
    summary: aboutContent.paragraph,
    experiences: experiences.map((experience) => ({
      company: experience.company,
      role: experience.role,
      period: experience.period,
      location: experience.location,
      highlights: experience.highlights,
    })),
    projects: projects.map((project) => ({
      title: project.title,
      description: project.description,
      tags: project.tags,
    })),
    technicalSkills: skillGroups.flatMap((group) => group.skills),
  };
}

export function formatResumeContentForPrompt(resume: ResumeContent): string {
  const experienceText = resume.experiences
    .map((experience) => {
      const highlights = experience.highlights.map((item) => `- ${item}`).join("\n");
      return `${experience.role} — ${experience.company} (${experience.period}, ${experience.location})\n${highlights}`;
    })
    .join("\n\n");

  const projectText = resume.projects
    .map((project) => {
      const tags = project.tags.join(", ");
      return `${project.title}: ${project.description} [${tags}]`;
    })
    .join("\n");

  return [
    `Name: ${resume.name}`,
    `Email: ${resume.email}`,
    `Website: ${resume.website}`,
    `LinkedIn: ${resume.linkedin}`,
    `Education: ${resume.education}`,
    "",
    "Summary:",
    resume.summary,
    "",
    "Experience:",
    experienceText,
    "",
    "Projects:",
    projectText,
    "",
    "Technical Skills:",
    resume.technicalSkills.join(", "),
  ].join("\n");
}

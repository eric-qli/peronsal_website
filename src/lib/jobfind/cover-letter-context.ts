import { parseApplicationNotes } from "@/lib/jobfind/notes-parser";
import { type JobApplication } from "@/lib/jobfind/types";

export interface CoverLetterJobContext {
  company: string;
  position: string;
  location: string | null;
  employmentType: string | null;
  experienceLevel: string | null;
  salary: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  applicationNotes: string | null;
}

export function buildCoverLetterJobContext(
  application: JobApplication
): CoverLetterJobContext {
  const parsed = parseApplicationNotes(application.notes);

  return {
    company: application.company,
    position: application.position,
    location: application.location,
    employmentType: parsed.employmentType,
    experienceLevel: parsed.experienceLevel,
    salary: parsed.salary,
    requiredSkills: application.requiredSkills,
    preferredSkills: parsed.preferredSkills,
    responsibilities: parsed.responsibilities,
    qualifications: parsed.qualifications,
    applicationNotes: parsed.freeformNotes,
  };
}

export function formatJobContextForPrompt(context: CoverLetterJobContext): string {
  const sections = [
    `Company: ${context.company}`,
    `Position: ${context.position}`,
    context.location ? `Location: ${context.location}` : null,
    context.employmentType ? `Employment Type: ${context.employmentType}` : null,
    context.experienceLevel ? `Experience Level: ${context.experienceLevel}` : null,
    context.salary ? `Salary: ${context.salary}` : null,
    "",
    "Required Skills:",
    context.requiredSkills.length > 0
      ? context.requiredSkills.map((skill) => `- ${skill}`).join("\n")
      : "- None listed",
    "",
    "Preferred Skills:",
    context.preferredSkills.length > 0
      ? context.preferredSkills.map((skill) => `- ${skill}`).join("\n")
      : "- None listed",
    "",
    "Responsibilities:",
    context.responsibilities.length > 0
      ? context.responsibilities.map((item) => `- ${item}`).join("\n")
      : "- None listed",
    "",
    "Qualifications:",
    context.qualifications.length > 0
      ? context.qualifications.map((item) => `- ${item}`).join("\n")
      : "- None listed",
  ];

  if (context.applicationNotes) {
    sections.push("", "Additional Application Notes:", context.applicationNotes);
  }

  return sections.filter((section) => section !== null).join("\n");
}

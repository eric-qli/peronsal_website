import { type ApplicationStatus, type CreateJobApplicationInput } from "@/lib/jobfind/types";
import { type ExtractedJob } from "@/lib/jobfind/extracted-job";
import {
  getTodayDateString,
  linesInputToArray,
  normalizeOptionalText,
  skillsArrayToInput,
  skillsInputToArray,
} from "@/lib/jobfind/utils";

export interface ExtractedReviewFormValues {
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  dateApplied: string;
  requiredSkills: string;
  preferredSkills: string;
  employmentType: string;
  experienceLevel: string;
  responsibilities: string;
  qualifications: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  sourceUrl: string;
  notes: string;
}

export function createEmptyReviewFormValues(): ExtractedReviewFormValues {
  return {
    company: "",
    position: "",
    location: "",
    status: "applied",
    dateApplied: getTodayDateString(),
    requiredSkills: "",
    preferredSkills: "",
    employmentType: "",
    experienceLevel: "",
    responsibilities: "",
    qualifications: "",
    salaryMin: "",
    salaryMax: "",
    currency: "",
    sourceUrl: "",
    notes: "",
  };
}

export function extractedJobToReviewForm(
  extracted: ExtractedJob
): ExtractedReviewFormValues {
  return {
    company: normalizeOptionalText(extracted.company),
    position: normalizeOptionalText(extracted.position),
    location: normalizeOptionalText(extracted.location),
    status: "applied",
    dateApplied: getTodayDateString(),
    requiredSkills: skillsArrayToInput(extracted.requiredSkills),
    preferredSkills: skillsArrayToInput(extracted.preferredSkills),
    employmentType: normalizeOptionalText(extracted.employmentType),
    experienceLevel: normalizeOptionalText(extracted.experienceLevel),
    responsibilities: extracted.responsibilities.join("\n"),
    qualifications: extracted.qualifications.join("\n"),
    salaryMin:
      extracted.salaryMin !== null && extracted.salaryMin !== undefined
        ? String(extracted.salaryMin)
        : "",
    salaryMax:
      extracted.salaryMax !== null && extracted.salaryMax !== undefined
        ? String(extracted.salaryMax)
        : "",
    currency: normalizeOptionalText(extracted.currency),
    sourceUrl: "",
    notes: "",
  };
}

function formatListSection(title: string, items: string[]): string | null {
  if (items.length === 0) return null;
  return `${title}:\n${items.map((item) => `- ${item}`).join("\n")}`;
}

export function buildNotesFromReviewForm(
  form: ExtractedReviewFormValues
): string | null {
  const sections: string[] = [];

  const userNotes = normalizeOptionalText(form.notes);
  if (userNotes) {
    sections.push(userNotes);
  }

  const employmentType = normalizeOptionalText(form.employmentType);
  if (employmentType) {
    sections.push(`Employment Type: ${employmentType}`);
  }

  const experienceLevel = normalizeOptionalText(form.experienceLevel);
  if (experienceLevel) {
    sections.push(`Experience Level: ${experienceLevel}`);
  }

  const salaryMin = normalizeOptionalText(form.salaryMin);
  const salaryMax = normalizeOptionalText(form.salaryMax);
  const currency = normalizeOptionalText(form.currency);

  if (salaryMin || salaryMax) {
    const range =
      salaryMin && salaryMax
        ? `${salaryMin} - ${salaryMax}`
        : salaryMin || salaryMax;
    sections.push(`Salary: ${range}${currency ? ` ${currency}` : ""}`);
  } else if (currency) {
    sections.push(`Currency: ${currency}`);
  }

  const preferredSkillsSection = formatListSection(
    "Preferred Skills",
    skillsInputToArray(form.preferredSkills)
  );
  if (preferredSkillsSection) sections.push(preferredSkillsSection);

  const responsibilitiesSection = formatListSection(
    "Responsibilities",
    linesInputToArray(form.responsibilities)
  );
  if (responsibilitiesSection) sections.push(responsibilitiesSection);

  const qualificationsSection = formatListSection(
    "Qualifications",
    linesInputToArray(form.qualifications)
  );
  if (qualificationsSection) sections.push(qualificationsSection);

  return sections.length > 0 ? sections.join("\n\n") : null;
}

export function reviewFormToCreateInput(
  form: ExtractedReviewFormValues
): CreateJobApplicationInput {
  return {
    company: form.company.trim(),
    position: form.position.trim(),
    location: normalizeOptionalText(form.location) || null,
    status: form.status ?? "applied",
    dateApplied: form.dateApplied,
    requiredSkills: skillsInputToArray(form.requiredSkills),
    sourceUrl: normalizeOptionalText(form.sourceUrl) || null,
    notes: buildNotesFromReviewForm(form),
  };
}

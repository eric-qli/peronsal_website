import "server-only";

import { type CoverLetterJobContext } from "@/lib/jobfind/cover-letter-context";
import { formatJobContextForPrompt } from "@/lib/jobfind/cover-letter-context";
import { type CoverLetterCountry } from "@/lib/jobfind/cover-letter";
import {
  formatResumeContentForPrompt,
  type ResumeContent,
} from "@/lib/profile/resume-content";

export interface PreparedCoverLetterContent {
  country: CoverLetterCountry;
  resumeText: string;
  jobText: string;
}

export function prepareCoverLetterPromptContent(
  resume: ResumeContent,
  application: CoverLetterJobContext,
  country: CoverLetterCountry
): PreparedCoverLetterContent {
  return {
    country,
    resumeText: formatResumeContentForPrompt(resume),
    jobText: formatJobContextForPrompt(application),
  };
}

export function buildCoverLetterSystemPrompt(country: CoverLetterCountry): string {
  const countryGuidance =
    country === "usa"
      ? "Use a professional U.S. business letter tone. Do not mention immigration, visa sponsorship, TN status, or U.S. work authorization. That content will be inserted separately by the application."
      : "Use a professional Canadian business letter tone. Do not mention immigration, visa sponsorship, TN status, or U.S. work authorization.";

  return `You are an expert career writer. Write a tailored cover letter using only the facts provided in the candidate resume and job application context.

Rules:
- Return structured JSON only through the provided schema.
- Write a professional, tailored cover letter.
- Target approximately 350-550 words across the opening paragraph and body paragraphs combined.
- Use natural, concise business English.
- Mention the exact company name and exact job title.
- Select the most relevant resume experiences and connect specific resume accomplishments to specific job requirements.
- Never invent employers, responsibilities, skills, achievements, education, credentials, years of experience, or immigration facts.
- Do not copy complete job description sentences.
- Avoid generic clichés, excessive praise, and unsupported claims.
- Do not include placeholders such as [Hiring Manager Name], [Company Address], or [Date].
- Use "Dear Hiring Manager," when no recipient name is available.
- End with signOff "Sincerely," and applicantName "Eric Li".
- Do not mention AI or automated generation.
- Do not include Markdown, HTML, commentary, or explanations.
- ${countryGuidance}`;
}

export function buildCoverLetterUserPrompt(
  content: PreparedCoverLetterContent
): string {
  return [
    `Country format: ${content.country === "usa" ? "USA" : "Canada"}`,
    "",
    "Candidate resume:",
    content.resumeText,
    "",
    "Job application context:",
    content.jobText,
    "",
    "Write the cover letter now.",
  ].join("\n");
}

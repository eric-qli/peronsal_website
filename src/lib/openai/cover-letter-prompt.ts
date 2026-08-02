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

Output rules:
- Return structured JSON only through the provided schema.
- Do not include commentary, explanations, or a document title.
- Do not include a subject line, heading, or title such as "Application for...", "Cover Letter", or a repeated company/position header.
- The letter body begins with the salutation. Date, company, and address block are added separately in the PDF.

Length:
- Target 350-500 words across openingParagraph, both bodyParagraphs, and closingParagraph combined.
- Do not submit fewer than 350 words.
- Use 4 concise paragraphs total in the JSON structure below.
- Prefer shorter sentences and short paragraphs so the letter fits on one page.

Structure:
1. openingParagraph (introduction): State the exact role and company. Give a concise summary of the candidate's background and strongest overall match. No generic enthusiasm or filler.
2. bodyParagraphs[0] (primary experience): Focus on the strongest relevant professional experience. Use one or two concrete examples from the resume. Connect directly to the job description. Prefer measurable or specific accomplishments. Do not repeat the entire resume.
3. bodyParagraphs[1] (secondary experience): Use another relevant work example or project from the resume. Mention only technologies and responsibilities supported by the resume. Keep this paragraph shorter than bodyParagraphs[0].
4. closingParagraph (closing): Summarize the value the candidate would bring and express interest in discussing the role. Do not repeat the full skill list.

Writing rules:
- Tailor the letter to the specific job description.
- Prioritize the 2-3 most relevant experiences only.
- Avoid restating every resume bullet or repeating the same skill.
- Use clear, direct, professional North American business English.
- Avoid generic phrases such as "I am a perfect fit", "I am extremely passionate", "Ever since I was young", "I am writing to express my strong interest", or similar filler.
- Avoid weak closing language such as "I hope", "I believe I may", or "I can quickly ramp".
- Avoid em dashes when a comma or period is clearer.
- Never invent metrics, technologies, responsibilities, or achievements.
- Do not claim experience with tools that appear only in the job description.
- When the candidate lacks direct experience with a required tool, connect related resume experience without overstating familiarity.
- Mention the exact company name and exact job title in the letter body.
- Use "Dear Hiring Manager," when no recipient name is available.
- End with signOff "Sincerely," and applicantName "Eric Li".
- Do not include placeholders such as [Hiring Manager Name] or [Date].
- Do not mention AI or automated generation.
- Do not include Markdown or HTML.
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

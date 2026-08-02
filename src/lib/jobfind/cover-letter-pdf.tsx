import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import { CoverLetterDocument } from "@/lib/jobfind/cover-letter-document";
import {
  formatCoverLetterDate,
  type AssembledCoverLetter,
} from "@/lib/jobfind/cover-letter-validation";
import { getResumeContent } from "@/lib/profile/resume-content";

export interface RenderCoverLetterPdfInput {
  letter: AssembledCoverLetter;
  company: string;
  position: string;
  location: string | null;
}

export async function renderCoverLetterPdf(
  input: RenderCoverLetterPdfInput
): Promise<Buffer> {
  const resume = getResumeContent();
  const linkedinLabel = resume.linkedin.replace(/^https?:\/\//, "");
  const websiteLabel = resume.website.replace(/^https?:\/\//, "");
  const contactLine = `${resume.email} | ${linkedinLabel} | ${websiteLabel}`;

  const buffer = await renderToBuffer(
    <CoverLetterDocument
      letter={input.letter}
      company={input.company}
      position={input.position}
      location={input.location}
      dateLabel={formatCoverLetterDate()}
      contactLine={contactLine}
      applicantName={resume.name}
    />
  );

  return Buffer.from(buffer);
}

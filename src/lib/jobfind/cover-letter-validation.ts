import { USA_TN_PARAGRAPH } from "@/lib/jobfind/cover-letter-constants";
import { type CoverLetterCountry } from "@/lib/jobfind/cover-letter";
import { type GeneratedCoverLetter } from "@/lib/openai/cover-letter-schema";

export interface AssembledCoverLetter {
  subjectLine: string;
  salutation: string;
  paragraphs: string[];
  signOff: string;
  applicantName: string;
}

const PLACEHOLDER_PATTERN = /\[[^\]]+\]/;
const CANADA_FORBIDDEN_PATTERNS = [
  /\btn\b/i,
  /trade nafta/i,
  /usmca/i,
  /visa sponsorship/i,
  /port of entry/i,
  /h-1b/i,
  /work authorization/i,
  /immigration/i,
];

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function normalizeParagraph(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function assembleCoverLetter(
  generated: GeneratedCoverLetter,
  country: CoverLetterCountry
): AssembledCoverLetter {
  const openingParagraph = normalizeParagraph(generated.openingParagraph);
  const bodyParagraphs = generated.bodyParagraphs
    .map(normalizeParagraph)
    .filter(Boolean);
  const closingParagraph = normalizeParagraph(generated.closingParagraph);

  const paragraphs = [
    openingParagraph,
    ...bodyParagraphs,
    ...(country === "usa" ? [USA_TN_PARAGRAPH] : []),
    closingParagraph,
  ].filter(Boolean);

  return {
    subjectLine: normalizeParagraph(generated.subjectLine),
    salutation: normalizeParagraph(generated.salutation),
    paragraphs,
    signOff: normalizeParagraph(generated.signOff),
    applicantName: normalizeParagraph(generated.applicantName),
  };
}

export class CoverLetterValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function validateGeneratedCoverLetter(
  generated: GeneratedCoverLetter,
  context: {
    company: string;
    position: string;
    country: CoverLetterCountry;
  }
): GeneratedCoverLetter {
  const sanitized: GeneratedCoverLetter = {
    subjectLine: normalizeParagraph(generated.subjectLine),
    salutation: normalizeParagraph(generated.salutation),
    openingParagraph: normalizeParagraph(generated.openingParagraph),
    bodyParagraphs: generated.bodyParagraphs
      .map(normalizeParagraph)
      .filter(Boolean),
    closingParagraph: normalizeParagraph(generated.closingParagraph),
    signOff: normalizeParagraph(generated.signOff),
    applicantName: normalizeParagraph(generated.applicantName),
  };

  if (!sanitized.salutation) {
    throw new CoverLetterValidationError("Cover letter salutation is missing.");
  }

  if (!sanitized.signOff) {
    throw new CoverLetterValidationError("Cover letter sign-off is missing.");
  }

  if (sanitized.bodyParagraphs.length === 0) {
    throw new CoverLetterValidationError("Cover letter body paragraphs are missing.");
  }

  const combinedText = [
    sanitized.subjectLine,
    sanitized.salutation,
    sanitized.openingParagraph,
    ...sanitized.bodyParagraphs,
    sanitized.closingParagraph,
    sanitized.signOff,
    sanitized.applicantName,
  ].join(" ");

  if (!combinedText.toLowerCase().includes(context.company.toLowerCase())) {
    throw new CoverLetterValidationError(
      "Cover letter does not reference the company name."
    );
  }

  if (!combinedText.toLowerCase().includes(context.position.toLowerCase())) {
    throw new CoverLetterValidationError(
      "Cover letter does not reference the position title."
    );
  }

  if (PLACEHOLDER_PATTERN.test(combinedText)) {
    throw new CoverLetterValidationError(
      "Cover letter contains unresolved placeholders."
    );
  }

  const modelWordCount = countWords(
    [
      sanitized.openingParagraph,
      ...sanitized.bodyParagraphs,
      sanitized.closingParagraph,
    ].join(" ")
  );

  if (modelWordCount < 180) {
    throw new CoverLetterValidationError("Cover letter is too short.");
  }

  if (modelWordCount > 700) {
    throw new CoverLetterValidationError("Cover letter is too long.");
  }

  if (context.country === "canada") {
    for (const pattern of CANADA_FORBIDDEN_PATTERNS) {
      if (pattern.test(combinedText)) {
        throw new CoverLetterValidationError(
          "Canadian cover letter contains unsupported immigration content."
        );
      }
    }
  }

  if (context.country === "usa") {
    if (combinedText.includes(USA_TN_PARAGRAPH)) {
      throw new CoverLetterValidationError(
        "Cover letter must not include the TN paragraph before assembly."
      );
    }
  }

  return sanitized;
}

export function validateAssembledCoverLetter(
  letter: AssembledCoverLetter,
  country: CoverLetterCountry
): void {
  const combinedText = [
    letter.subjectLine,
    letter.salutation,
    ...letter.paragraphs,
    letter.signOff,
    letter.applicantName,
  ].join(" ");

  if (country === "usa") {
    const tnCount = letter.paragraphs.filter(
      (paragraph) => paragraph === USA_TN_PARAGRAPH
    ).length;

    if (tnCount !== 1) {
      throw new CoverLetterValidationError(
        "USA cover letter must include the TN paragraph exactly once."
      );
    }
  } else {
    if (letter.paragraphs.some((paragraph) => paragraph === USA_TN_PARAGRAPH)) {
      throw new CoverLetterValidationError(
        "Canadian cover letter must not include the TN paragraph."
      );
    }
  }

  if (PLACEHOLDER_PATTERN.test(combinedText)) {
    throw new CoverLetterValidationError(
      "Cover letter contains unresolved placeholders."
    );
  }
}

export function formatCoverLetterDate(date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

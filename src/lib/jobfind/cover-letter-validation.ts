import { USA_TN_PARAGRAPH } from "@/lib/jobfind/cover-letter-constants";
import { type CoverLetterCountry } from "@/lib/jobfind/cover-letter";
import { type GeneratedCoverLetter } from "@/lib/openai/cover-letter-schema";

export interface AssembledCoverLetter {
  salutation: string;
  paragraphs: string[];
  signOff: string;
  applicantName: string;
}

const PLACEHOLDER_PATTERN = /\[[^\]]+\]/;
const TITLE_LINE_PATTERN =
  /^(application for|cover letter|re:\s|subject:\s)/i;
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
const GENERIC_PHRASE_PATTERNS = [
  /i am writing to express my strong interest/i,
  /i am extremely passionate/i,
  /ever since i was young/i,
  /i am a perfect fit/i,
];

export const COVER_LETTER_MIN_WORDS = 350;
export const COVER_LETTER_MAX_WORDS = 500;
export const COVER_LETTER_USA_MAX_TOTAL_WORDS = 560;

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function normalizeParagraph(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function companyIsReferenced(combinedText: string, company: string): boolean {
  const normalizedText = combinedText.toLowerCase();
  const normalizedCompany = company.trim().toLowerCase();

  if (normalizedCompany && normalizedText.includes(normalizedCompany)) {
    return true;
  }

  const withoutParenthetical = company.replace(/\s*\([^)]*\)/g, "").trim();
  if (
    withoutParenthetical &&
    normalizedText.includes(withoutParenthetical.toLowerCase())
  ) {
    return true;
  }

  const significantTokens = company
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/[^a-zA-Z0-9.-]/g, ""))
    .filter((token) => token.length >= 4);

  return significantTokens.some((token) =>
    normalizedText.includes(token.toLowerCase())
  );
}

function positionIsReferenced(combinedText: string, position: string): boolean {
  const normalizedText = combinedText.toLowerCase();
  const normalizedPosition = position.trim().toLowerCase();

  if (normalizedPosition && normalizedText.includes(normalizedPosition)) {
    return true;
  }

  const significantTokens = position
    .split(/\s+/)
    .map((token) => token.replace(/[^a-zA-Z0-9.-]/g, ""))
    .filter((token) => token.length >= 4);

  return significantTokens.some((token) =>
    normalizedText.includes(token.toLowerCase())
  );
}

function getModelParagraphs(generated: GeneratedCoverLetter): string[] {
  return [
    normalizeParagraph(generated.openingParagraph),
    ...generated.bodyParagraphs.map(normalizeParagraph).filter(Boolean),
    normalizeParagraph(generated.closingParagraph),
  ].filter(Boolean);
}

function assertNoTitleLines(paragraphs: string[]): void {
  for (const paragraph of paragraphs) {
    const firstLine = paragraph.split("\n")[0]?.trim() ?? paragraph;
    if (TITLE_LINE_PATTERN.test(firstLine)) {
      throw new CoverLetterValidationError(
        "Cover letter must not include a separate title or subject heading."
      );
    }
  }
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

  if (sanitized.bodyParagraphs.length !== 2) {
    throw new CoverLetterValidationError(
      "Cover letter must include exactly two body paragraphs."
    );
  }

  const modelParagraphs = getModelParagraphs(sanitized);
  assertNoTitleLines(modelParagraphs);

  const combinedText = [
    sanitized.salutation,
    ...modelParagraphs,
    sanitized.signOff,
    sanitized.applicantName,
  ].join(" ");

  if (!companyIsReferenced(combinedText, context.company)) {
    throw new CoverLetterValidationError(
      "Cover letter does not reference the company name."
    );
  }

  if (!positionIsReferenced(combinedText, context.position)) {
    throw new CoverLetterValidationError(
      "Cover letter does not reference the position title."
    );
  }

  if (PLACEHOLDER_PATTERN.test(combinedText)) {
    throw new CoverLetterValidationError(
      "Cover letter contains unresolved placeholders."
    );
  }

  for (const pattern of GENERIC_PHRASE_PATTERNS) {
    if (pattern.test(combinedText)) {
      throw new CoverLetterValidationError(
        "Cover letter contains generic filler language."
      );
    }
  }

  const modelWordCount = countWords(modelParagraphs.join(" "));

  if (modelWordCount < COVER_LETTER_MIN_WORDS) {
    throw new CoverLetterValidationError(
      `Cover letter is too short (${modelWordCount} words). Target ${COVER_LETTER_MIN_WORDS}-${COVER_LETTER_MAX_WORDS} words.`
    );
  }

  if (modelWordCount > COVER_LETTER_MAX_WORDS) {
    throw new CoverLetterValidationError(
      `Cover letter is too long (${modelWordCount} words). Target ${COVER_LETTER_MIN_WORDS}-${COVER_LETTER_MAX_WORDS} words.`
    );
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

    const assembledPreview = assembleCoverLetter(sanitized, "usa");
    const totalWordCount = countWords(
      [...assembledPreview.paragraphs, assembledPreview.signOff].join(" ")
    );

    if (totalWordCount > COVER_LETTER_USA_MAX_TOTAL_WORDS) {
      throw new CoverLetterValidationError(
        `Cover letter exceeds one-page length (${totalWordCount} words including TN paragraph).`
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
    letter.salutation,
    ...letter.paragraphs,
    letter.signOff,
    letter.applicantName,
  ].join(" ");

  assertNoTitleLines(letter.paragraphs);

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

  const totalWordCount = countWords(
    [...letter.paragraphs, letter.signOff].join(" ")
  );

  const maxWords =
    country === "usa"
      ? COVER_LETTER_USA_MAX_TOTAL_WORDS
      : COVER_LETTER_MAX_WORDS;

  if (totalWordCount > maxWords) {
    throw new CoverLetterValidationError(
      `Cover letter exceeds one-page length (${totalWordCount} words).`
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

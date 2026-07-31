import { z } from "zod";

export const generatedCoverLetterSchema = z.object({
  subjectLine: z.string(),
  salutation: z.string(),
  openingParagraph: z.string(),
  bodyParagraphs: z.array(z.string()).min(1).max(3),
  closingParagraph: z.string(),
  signOff: z.string(),
  applicantName: z.string(),
});

export type GeneratedCoverLetter = z.infer<typeof generatedCoverLetterSchema>;

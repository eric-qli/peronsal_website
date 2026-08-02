import { z } from "zod";

export const generatedCoverLetterSchema = z.object({
  salutation: z.string(),
  openingParagraph: z.string(),
  bodyParagraphs: z.array(z.string()).min(2).max(2),
  closingParagraph: z.string(),
  signOff: z.string(),
  applicantName: z.string(),
});

export type GeneratedCoverLetter = z.infer<typeof generatedCoverLetterSchema>;

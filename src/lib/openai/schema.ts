import { z } from "zod";

export const jobExtractionSchema = z.object({
  company: z.string().nullable(),
  position: z.string().nullable(),
  location: z.string().nullable(),
  employmentType: z.string().nullable(),
  experienceLevel: z.string().nullable(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  currency: z.string().nullable(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  qualifications: z.array(z.string()),
});

export type JobExtractionResult = z.infer<typeof jobExtractionSchema>;

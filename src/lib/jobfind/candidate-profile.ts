export const candidateSkills = [
  "Python",
  "SQL",
  "Java",
  "TypeScript",
  "React",
  "Next.js",
  "PostgreSQL",
  "Supabase",
  "Pandas",
  "NumPy",
  "PyTorch",
  "NLP",
  "Docker",
  "Git",
] as const;

export type CandidateSkill = (typeof candidateSkills)[number];

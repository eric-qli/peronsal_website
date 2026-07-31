import { candidateSkills } from "@/lib/jobfind/candidate-profile";

export interface SkillMatchResult {
  available: boolean;
  percentage: number;
  matched: string[];
  missing: string[];
}

export function normalizeSkillName(skill: string): string {
  return skill.trim().toLowerCase().replace(/\s+/g, " ");
}

export function dedupeSkillsCaseInsensitive(skills: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const skill of skills) {
    const trimmed = skill.trim();
    if (!trimmed) continue;

    const key = normalizeSkillName(trimmed);
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

export function calculateSkillMatch(
  requiredSkills: string[],
  profileSkills: readonly string[] = candidateSkills
): SkillMatchResult {
  const uniqueRequired = dedupeSkillsCaseInsensitive(requiredSkills);

  if (uniqueRequired.length === 0) {
    return {
      available: false,
      percentage: 0,
      matched: [],
      missing: [],
    };
  }

  const profileSet = new Set(profileSkills.map(normalizeSkillName));
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of uniqueRequired) {
    if (profileSet.has(normalizeSkillName(skill))) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const percentage = Math.round((matched.length / uniqueRequired.length) * 100);

  return {
    available: true,
    percentage,
    matched,
    missing,
  };
}

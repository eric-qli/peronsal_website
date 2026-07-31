import { dedupeSkillsCaseInsensitive } from "@/lib/jobfind/match";

export interface ParsedApplicationNotes {
  freeformNotes: string | null;
  employmentType: string | null;
  experienceLevel: string | null;
  salary: string | null;
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
}

function parseListBlock(block: string, header: string): string[] {
  const lines = block.split("\n");
  const items: string[] = [];

  for (const line of lines.slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    items.push(trimmed.replace(/^[-•*]\s*/, ""));
  }

  if (items.length === 0) {
    const inline = block.slice(header.length).trim();
    if (inline) {
      return dedupeSkillsCaseInsensitive(inline.split(","));
    }
  }

  return dedupeSkillsCaseInsensitive(items);
}

function parseSingleLineValue(block: string, prefix: string): string | null {
  const value = block.slice(prefix.length).trim();
  return value.length > 0 ? value : null;
}

export function parseApplicationNotes(
  notes: string | null | undefined
): ParsedApplicationNotes {
  const result: ParsedApplicationNotes = {
    freeformNotes: null,
    employmentType: null,
    experienceLevel: null,
    salary: null,
    preferredSkills: [],
    responsibilities: [],
    qualifications: [],
  };

  if (!notes?.trim()) {
    return result;
  }

  const freeformParts: string[] = [];
  const blocks = notes.split(/\n\s*\n/);

  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    if (trimmedBlock.startsWith("Employment Type:")) {
      result.employmentType = parseSingleLineValue(trimmedBlock, "Employment Type:");
      continue;
    }

    if (trimmedBlock.startsWith("Experience Level:")) {
      result.experienceLevel = parseSingleLineValue(trimmedBlock, "Experience Level:");
      continue;
    }

    if (trimmedBlock.startsWith("Salary:")) {
      result.salary = parseSingleLineValue(trimmedBlock, "Salary:");
      continue;
    }

    if (trimmedBlock.startsWith("Currency:")) {
      const currency = parseSingleLineValue(trimmedBlock, "Currency:");
      result.salary = result.salary
        ? `${result.salary} ${currency ?? ""}`.trim()
        : currency;
      continue;
    }

    if (trimmedBlock.startsWith("Preferred Skills:")) {
      result.preferredSkills = parseListBlock(trimmedBlock, "Preferred Skills:");
      continue;
    }

    if (trimmedBlock.startsWith("Responsibilities:")) {
      result.responsibilities = parseListBlock(trimmedBlock, "Responsibilities:");
      continue;
    }

    if (trimmedBlock.startsWith("Qualifications:")) {
      result.qualifications = parseListBlock(trimmedBlock, "Qualifications:");
      continue;
    }

    freeformParts.push(trimmedBlock);
  }

  result.freeformNotes = freeformParts.length > 0 ? freeformParts.join("\n\n") : null;
  return result;
}

export function getNotesPreview(
  notes: string | null | undefined,
  maxLength = 80
): string | null {
  if (!notes?.trim()) return null;

  const parsed = parseApplicationNotes(notes);
  const previewSource = parsed.freeformNotes ?? notes;
  const singleLine = previewSource.replace(/\s+/g, " ").trim();

  if (singleLine.length <= maxLength) {
    return singleLine;
  }

  return `${singleLine.slice(0, maxLength).trim()}…`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function sanitizeCoverLetterFilename(
  company: string,
  position: string
): string {
  const companySlug = slugify(company);
  const positionSlug = slugify(position);

  if (!companySlug && !positionSlug) {
    return "cover-letter.pdf";
  }

  if (!companySlug) {
    return `${positionSlug}-cover-letter.pdf`;
  }

  if (!positionSlug) {
    return `${companySlug}-cover-letter.pdf`;
  }

  return `${companySlug}-${positionSlug}-cover-letter.pdf`;
}

export function getFilenameFromContentDisposition(
  header: string | null
): string | null {
  if (!header) return null;

  const match = header.match(/filename="([^"]+)"/i);
  return match?.[1] ?? null;
}

export type CoverLetterCountry = "canada" | "usa";

const US_KEYWORDS = [
  "united states",
  "usa",
  "u.s.",
  "u.s.a.",
  "new york",
  "california",
  "texas",
  "washington",
  "massachusetts",
  "illinois",
  "florida",
  "seattle",
  "san francisco",
  "los angeles",
  "boston",
  "chicago",
  "mountain view",
  "palo alto",
  "austin",
  "denver",
  "atlanta",
  "philadelphia",
];

const CANADA_KEYWORDS = [
  "canada",
  "toronto",
  "ontario",
  "vancouver",
  "british columbia",
  "montreal",
  "montréal",
  "quebec",
  "québec",
  "calgary",
  "alberta",
  "ottawa",
  "waterloo",
  "mississauga",
  "markham",
];

const US_STATE_ABBREVS = new Set([
  "al",
  "ak",
  "az",
  "ar",
  "co",
  "ct",
  "de",
  "fl",
  "ga",
  "hi",
  "id",
  "il",
  "in",
  "ia",
  "ks",
  "ky",
  "la",
  "me",
  "md",
  "ma",
  "mi",
  "mn",
  "ms",
  "mo",
  "mt",
  "ne",
  "nv",
  "nh",
  "nj",
  "nm",
  "ny",
  "nc",
  "nd",
  "oh",
  "ok",
  "or",
  "pa",
  "ri",
  "sc",
  "sd",
  "tn",
  "tx",
  "ut",
  "vt",
  "va",
  "wa",
  "wv",
  "wi",
  "wy",
  "dc",
]);

const CANADA_PROVINCE_ABBREVS = new Set(["on", "bc", "qc", "ab", "mb", "sk", "ns", "nb", "nl", "pe", "nt", "yt", "nu"]);

function countKeywordMatches(value: string, keywords: string[]): number {
  return keywords.reduce(
    (count, keyword) => (value.includes(keyword) ? count + 1 : count),
    0
  );
}

function hasUsStateAbbreviation(value: string): boolean {
  const matches = value.match(/,\s*([a-z]{2})\b/g) ?? [];
  return matches.some((match) => {
    const abbrev = match.replace(",", "").trim();
    return US_STATE_ABBREVS.has(abbrev);
  });
}

function hasCanadaProvinceAbbreviation(value: string): boolean {
  const matches = value.match(/,\s*([a-z]{2})\b/g) ?? [];
  return matches.some((match) => {
    const abbrev = match.replace(",", "").trim();
    return CANADA_PROVINCE_ABBREVS.has(abbrev);
  });
}

export function inferCoverLetterCountry(
  location: string | null | undefined
): CoverLetterCountry {
  if (!location?.trim()) {
    return "canada";
  }

  const normalized = location.toLowerCase().trim();

  const usScore =
    countKeywordMatches(normalized, US_KEYWORDS) +
    (hasUsStateAbbreviation(normalized) ? 2 : 0);
  const canadaScore =
    countKeywordMatches(normalized, CANADA_KEYWORDS) +
    (hasCanadaProvinceAbbreviation(normalized) ? 2 : 0);

  if (usScore > canadaScore) {
    return "usa";
  }

  if (canadaScore > usScore) {
    return "canada";
  }

  if (/\b(united states|usa|u\.s\.)\b/.test(normalized)) {
    return "usa";
  }

  if (/\bcanada\b/.test(normalized)) {
    return "canada";
  }

  return "canada";
}

/**
 * Documented inference test cases for manual verification.
 *
 * | Location                 | Expected |
 * | ------------------------ | -------- |
 * | Toronto, ON              | canada   |
 * | Vancouver, BC            | canada   |
 * | Toronto, Canada          | canada   |
 * | New York, NY             | usa      |
 * | San Francisco, CA        | usa      |
 * | California, USA          | usa      |
 * | Remote - United States   | usa      |
 * | Remote                   | canada   |
 * | Unknown location         | canada   |
 * | null                     | canada   |
 */
export const coverLetterCountryTestCases: Array<{
  location: string | null;
  expected: CoverLetterCountry;
}> = [
  { location: "Toronto, ON", expected: "canada" },
  { location: "Vancouver, BC", expected: "canada" },
  { location: "Toronto, Canada", expected: "canada" },
  { location: "New York, NY", expected: "usa" },
  { location: "San Francisco, CA", expected: "usa" },
  { location: "California, USA", expected: "usa" },
  { location: "Remote - United States", expected: "usa" },
  { location: "Remote", expected: "canada" },
  { location: "Unknown location", expected: "canada" },
  { location: null, expected: "canada" },
];

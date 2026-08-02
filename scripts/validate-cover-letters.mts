/**
 * Manual cover-letter validation script.
 * Run: npx tsx scripts/validate-cover-letters.mts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  assembleCoverLetter,
  validateAssembledCoverLetter,
  validateGeneratedCoverLetter,
  COVER_LETTER_MAX_WORDS,
  COVER_LETTER_MIN_WORDS,
} from "../src/lib/jobfind/cover-letter-validation";
import { type GeneratedCoverLetter } from "../src/lib/openai/cover-letter-schema";

const OUTPUT_DIR = join(process.cwd(), "tmp/cover-letter-validation");

function wordParagraph(targetWords: number, seed: string): string {
  const words = seed.split(/\s+/);
  const out: string[] = [];
  let i = 0;
  while (out.length < targetWords) {
    out.push(words[i % words.length]!);
    i += 1;
  }
  return out.join(" ");
}

function buildMockLetter(options: {
  company: string;
  position: string;
  introExtra?: string;
}): GeneratedCoverLetter {
  const { company, position, introExtra = "" } = options;
  const openingParagraph = [
    `I am applying for the ${position} role at ${company}.`,
    introExtra,
    wordParagraph(
      85,
      "My background spans software engineering data pipelines cloud platforms Python SQL distributed systems analytics and production delivery across financial and technology environments."
    ),
  ]
    .filter(Boolean)
    .join(" ");

  const bodyOne = wordParagraph(
    95,
    "At my most recent role I built batch and streaming data workflows integrated warehouse models improved reliability and partnered with analysts to deliver trusted metrics for business decisions using Python SQL and cloud tooling."
  );

  const bodyTwo = wordParagraph(
    75,
    "In an earlier project I implemented API services monitoring and deployment automation while collaborating across product and engineering teams to ship maintainable features on schedule."
  );

  const closingParagraph = wordParagraph(
    70,
    "I would bring disciplined execution strong communication and hands-on engineering experience to ${company} and welcome the opportunity to discuss how my background supports the ${position} team."
  ).replaceAll("${company}", company).replaceAll("${position}", position);

  return {
    salutation: "Dear Hiring Manager,",
    openingParagraph,
    bodyParagraphs: [bodyOne, bodyTwo],
    closingParagraph,
    signOff: "Sincerely,",
    applicantName: "Eric Li",
  };
}

interface Scenario {
  name: string;
  country: "canada" | "usa";
  company: string;
  position: string;
  letter: GeneratedCoverLetter;
}

const scenarios: Scenario[] = [
  {
    name: "canadian-data-engineer",
    country: "canada",
    company: "TD",
    position: "Data Engineer",
    letter: buildMockLetter({
      company: "TD",
      position: "Data Engineer",
      introExtra:
        "I have experience building data pipelines, warehouse models, and production analytics workflows in Toronto-area financial technology settings.",
    }),
  },
  {
    name: "us-software-engineer-tn",
    country: "usa",
    company: "Stripe",
    position: "Software Engineer",
    letter: buildMockLetter({
      company: "Stripe",
      position: "Software Engineer",
      introExtra:
        "My experience includes backend services, API design, and scalable payment-adjacent systems across high-growth product teams.",
    }),
  },
  {
    name: "many-requirements",
    country: "canada",
    company: "Shopify",
    position: "Senior Data Engineer",
    letter: buildMockLetter({
      company: "Shopify",
      position: "Senior Data Engineer",
      introExtra:
        "The role's requirements across Spark Airflow Kafka dbt and cloud warehousing align with my work delivering governed datasets and reliable pipeline orchestration.",
    }),
  },
  {
    name: "partial-resume-match",
    country: "canada",
    company: "RBC",
    position: "Machine Learning Engineer",
    letter: buildMockLetter({
      company: "RBC",
      position: "Machine Learning Engineer",
      introExtra:
        "While my recent work centers on data engineering and software delivery, I have transferable experience in model deployment workflows feature pipelines and production ML support tasks.",
    }),
  },
];

async function runScenario(scenario: Scenario): Promise<void> {
  const validated = validateGeneratedCoverLetter(scenario.letter, {
    company: scenario.company,
    position: scenario.position,
    country: scenario.country,
  });

  const assembled = assembleCoverLetter(validated, scenario.country);
  validateAssembledCoverLetter(assembled, scenario.country);

  const modelWordCount = [
    validated.openingParagraph,
    ...validated.bodyParagraphs,
    validated.closingParagraph,
  ]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  const totalWordCount = assembled.paragraphs.join(" ").split(/\s+/).filter(Boolean)
    .length;

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonPath = join(OUTPUT_DIR, `${scenario.name}.json`);
  writeFileSync(jsonPath, JSON.stringify(assembled, null, 2));

  console.log(`[ok] ${scenario.name}`);
  console.log(`     model words: ${modelWordCount} (target ${COVER_LETTER_MIN_WORDS}-${COVER_LETTER_MAX_WORDS})`);
  console.log(`     assembled words: ${totalWordCount}`);
  console.log(`     output: ${jsonPath}`);
  console.log(`     has TN: ${assembled.paragraphs.some((p) => p.includes("TN (USMCA)"))}`);
}

async function main(): Promise<void> {
  for (const scenario of scenarios) {
    await runScenario(scenario);
  }

  console.log("\nAll cover-letter validation scenarios passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

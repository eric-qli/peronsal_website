import "server-only";

import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

export const DEFAULT_EXTRACTION_MODEL = "gpt-5-mini";

export function createOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY");
  }

  openaiClient = new OpenAI({
    apiKey,
    timeout: 60_000,
  });

  return openaiClient;
}

export function getExtractionModel(): string {
  return process.env.OPENAI_EXTRACTION_MODEL?.trim() || DEFAULT_EXTRACTION_MODEL;
}

export function getCoverLetterModel(): string {
  return (
    process.env.OPENAI_MODEL?.trim() ||
    process.env.OPENAI_EXTRACTION_MODEL?.trim() ||
    DEFAULT_EXTRACTION_MODEL
  );
}

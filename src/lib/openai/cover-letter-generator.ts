import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  buildCoverLetterSystemPrompt,
  buildCoverLetterUserPrompt,
  prepareCoverLetterPromptContent,
} from "@/lib/openai/cover-letter-prompt";
import {
  generatedCoverLetterSchema,
  type GeneratedCoverLetter,
} from "@/lib/openai/cover-letter-schema";
import {
  createOpenAIClient,
  getCoverLetterModel,
} from "@/lib/openai/client";
import { type CoverLetterJobContext } from "@/lib/jobfind/cover-letter-context";
import { type CoverLetterCountry } from "@/lib/jobfind/cover-letter";
import { getResumeContent } from "@/lib/profile/resume-content";

export interface CoverLetterGenerationMeta {
  processingTimeMs: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface CoverLetterGenerationResult {
  data: GeneratedCoverLetter;
  meta: CoverLetterGenerationMeta;
}

export class CoverLetterGenerationError extends Error {
  code:
    | "CONFIGURATION"
    | "OPENAI"
    | "TIMEOUT"
    | "INVALID_OUTPUT"
    | "MISSING_RESUME";

  constructor(
    message: string,
    code:
      | "CONFIGURATION"
      | "OPENAI"
      | "TIMEOUT"
      | "INVALID_OUTPUT"
      | "MISSING_RESUME"
  ) {
    super(message);
    this.code = code;
  }
}

export async function generateCoverLetter({
  application,
  country,
}: {
  application: CoverLetterJobContext;
  country: CoverLetterCountry;
}): Promise<CoverLetterGenerationResult> {
  const startedAt = Date.now();
  const model = getCoverLetterModel();
  const resume = getResumeContent();

  if (!resume.name || !resume.email) {
    throw new CoverLetterGenerationError(
      "Resume content is unavailable.",
      "MISSING_RESUME"
    );
  }

  const promptContent = prepareCoverLetterPromptContent(
    resume,
    application,
    country
  );

  let client;

  try {
    client = createOpenAIClient();
  } catch {
    throw new CoverLetterGenerationError(
      "OpenAI API key is not configured on the server.",
      "CONFIGURATION"
    );
  }

  try {
    const response = await client.responses.parse({
      model,
      input: [
        { role: "system", content: buildCoverLetterSystemPrompt(country) },
        { role: "user", content: buildCoverLetterUserPrompt(promptContent) },
      ],
      text: {
        format: zodTextFormat(generatedCoverLetterSchema, "cover_letter"),
      },
    });

    if (!response.output_parsed) {
      throw new CoverLetterGenerationError(
        "OpenAI returned an invalid cover letter result.",
        "INVALID_OUTPUT"
      );
    }

    return {
      data: response.output_parsed,
      meta: {
        processingTimeMs: Date.now() - startedAt,
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        model: response.model ?? model,
      },
    };
  } catch (error) {
    if (error instanceof CoverLetterGenerationError) {
      throw error;
    }

    if (error instanceof OpenAI.APIError) {
      if (error.status === 408 || error.message.toLowerCase().includes("timeout")) {
        throw new CoverLetterGenerationError(
          "The OpenAI request timed out.",
          "TIMEOUT"
        );
      }

      console.error("[cover-letter] OpenAI request failed:", error.message);
      throw new CoverLetterGenerationError(
        "OpenAI request failed.",
        "OPENAI"
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new CoverLetterGenerationError(
        "The OpenAI request timed out.",
        "TIMEOUT"
      );
    }

    console.error("[cover-letter] Unexpected OpenAI error:", error);
    throw new CoverLetterGenerationError(
      "OpenAI request failed.",
      "OPENAI"
    );
  }
}

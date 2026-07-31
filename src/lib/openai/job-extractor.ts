import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  createOpenAIClient,
  getExtractionModel,
} from "@/lib/openai/client";
import {
  jobExtractionSchema,
  type JobExtractionResult,
} from "@/lib/openai/schema";

const SYSTEM_PROMPT = `You are a recruiting assistant. Extract structured information from the job description provided by the user.

Rules:
- Return only information explicitly stated or clearly implied in the job description.
- Do not invent or guess missing details.
- If a field is not present, use null for nullable fields.
- If a list field has no items, return an empty array.
- For salary fields, extract numeric values only when amounts are stated.
- Use ISO 4217 currency codes when a currency is mentioned (for example USD, CAD, EUR).`;

export interface JobExtractionMeta {
  processingTimeMs: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface JobExtractionResponse {
  data: JobExtractionResult;
  meta: JobExtractionMeta;
}

export class JobExtractionError extends Error {
  code: "CONFIGURATION" | "OPENAI" | "TIMEOUT" | "INVALID_JSON";

  constructor(
    message: string,
    code: "CONFIGURATION" | "OPENAI" | "TIMEOUT" | "INVALID_JSON"
  ) {
    super(message);
    this.code = code;
  }
}

export async function extractJobInformation(
  jobDescription: string
): Promise<JobExtractionResponse> {
  const startedAt = Date.now();
  const model = getExtractionModel();

  let client;

  try {
    client = createOpenAIClient();
  } catch {
    throw new JobExtractionError(
      "OpenAI API key is not configured on the server.",
      "CONFIGURATION"
    );
  }

  try {
    const response = await client.responses.parse({
      model,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: jobDescription },
      ],
      text: {
        format: zodTextFormat(jobExtractionSchema, "job_extraction"),
      },
    });

    if (!response.output_parsed) {
      throw new JobExtractionError(
        "OpenAI returned an invalid extraction result.",
        "INVALID_JSON"
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
    if (error instanceof JobExtractionError) {
      throw error;
    }

    if (error instanceof OpenAI.APIError) {
      if (error.status === 408 || error.message.toLowerCase().includes("timeout")) {
        throw new JobExtractionError(
          "The OpenAI request timed out. Try again with a shorter job description.",
          "TIMEOUT"
        );
      }

      console.error("[openai] Extraction failed:", error.message);
      throw new JobExtractionError(
        "OpenAI request failed. Please try again.",
        "OPENAI"
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new JobExtractionError(
        "The OpenAI request timed out. Try again with a shorter job description.",
        "TIMEOUT"
      );
    }

    console.error("[openai] Unexpected extraction error:", error);
    throw new JobExtractionError(
      "OpenAI request failed. Please try again.",
      "OPENAI"
    );
  }
}

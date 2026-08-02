import { NextRequest, NextResponse } from "next/server";
import {
  assembleCoverLetter,
  CoverLetterValidationError,
  validateAssembledCoverLetter,
  validateGeneratedCoverLetter,
} from "@/lib/jobfind/cover-letter-validation";
import { buildCoverLetterJobContext } from "@/lib/jobfind/cover-letter-context";
import { sanitizeCoverLetterFilename } from "@/lib/jobfind/cover-letter-filename";
import { renderCoverLetterPdf } from "@/lib/jobfind/cover-letter-pdf";
import {
  apiError,
  coverLetterError,
  isConfigurationError,
  logConfigurationError,
  zodFields,
} from "@/lib/jobfind/errors";
import { getApplicationById } from "@/lib/jobfind/queries";
import {
  applicationIdSchema,
  coverLetterRequestSchema,
} from "@/lib/jobfind/schemas";
import {
  CoverLetterGenerationError,
  generateCoverLetter,
} from "@/lib/openai/cover-letter-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const startedAt = Date.now();

  try {
    const { id } = await context.params;
    const parsedId = applicationIdSchema.safeParse(id);

    if (!parsedId.success) {
      return coverLetterError(
        "The cover letter could not be generated. Please try again.",
        400
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return coverLetterError(
        "The cover letter could not be generated. Please try again.",
        400
      );
    }

    const parsedBody = coverLetterRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return coverLetterError(
        "The cover letter could not be generated. Please try again.",
        400,
        zodFields(parsedBody.error)
      );
    }

    const application = await getApplicationById(parsedId.data);

    if (!application) {
      return coverLetterError(
        "The cover letter could not be generated. Please try again.",
        404
      );
    }

    if (!application.company.trim() || !application.position.trim()) {
      return coverLetterError(
        "The cover letter could not be generated. Please try again.",
        400
      );
    }

    const jobContext = buildCoverLetterJobContext(application);
    const country = parsedBody.data.country;

    console.info("[cover-letter] generation started", {
      applicationId: parsedId.data,
      country,
    });

    let generation = await generateCoverLetter({
      application: jobContext,
      country,
    });

    let validated;

    try {
      validated = validateGeneratedCoverLetter(generation.data, {
        company: jobContext.company,
        position: jobContext.position,
        country,
      });
    } catch (firstValidationError) {
      if (!(firstValidationError instanceof CoverLetterValidationError)) {
        throw firstValidationError;
      }

      console.warn("[cover-letter] validation failed, retrying generation", {
        message: firstValidationError.message,
      });

      generation = await generateCoverLetter({
        application: jobContext,
        country,
      });

      validated = validateGeneratedCoverLetter(generation.data, {
        company: jobContext.company,
        position: jobContext.position,
        country,
      });
    }

    const assembled = assembleCoverLetter(validated, country);
    validateAssembledCoverLetter(assembled, country);

    const pdfBuffer = await renderCoverLetterPdf({
      letter: assembled,
      company: jobContext.company,
      position: jobContext.position,
      location: jobContext.location,
    });

    const filename = sanitizeCoverLetterFilename(
      jobContext.company,
      jobContext.position
    );

    console.info("[cover-letter] generation succeeded", {
      applicationId: parsedId.data,
      country,
      model: generation.meta.model,
      processingTimeMs: Date.now() - startedAt,
      inputTokens: generation.meta.inputTokens,
      outputTokens: generation.meta.outputTokens,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof CoverLetterGenerationError) {
      console.error("[cover-letter] generation failed", {
        code: error.code,
        processingTimeMs: Date.now() - startedAt,
      });
      return coverLetterError(
        "The cover letter could not be generated. Please try again.",
        error.code === "CONFIGURATION" ? 500 : 502
      );
    }

    if (error instanceof CoverLetterValidationError) {
      console.error("[cover-letter] validation failed", {
        message: error.message,
        processingTimeMs: Date.now() - startedAt,
      });
      return coverLetterError(
        "The cover letter could not be generated. Please try again.",
        502
      );
    }

    if (isConfigurationError(error)) {
      logConfigurationError(error, "POST /applications/[id]/cover-letter configuration");
      return apiError(
        "CONFIGURATION_ERROR",
        "Server configuration error.",
        500
      );
    }

    console.error("[cover-letter] unexpected failure", {
      processingTimeMs: Date.now() - startedAt,
    });

    return coverLetterError(
      "The cover letter could not be generated. Please try again.",
      500
    );
  }
}

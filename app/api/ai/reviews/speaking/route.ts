import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOrGetAiReview } from "@/lib/ai/review-service";
import { AiReviewServiceError } from "@/lib/ai/types";

// Allow up to 60 seconds on Vercel Serverless Functions to prevent 504 timeouts during AI evaluation
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const result = await generateOrGetAiReview({
      supabase,
      userId: user.id,
      expectedType: "speaking",
      rawInput: body,
    });

    return NextResponse.json(result, {
      status: result.cached ? 200 : 201,
    });
  } catch (err) {
    if (err instanceof AiReviewServiceError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }
    return NextResponse.json(
      {
        error: "An unexpected error occurred while generating your speaking review.",
        code: "PROVIDER_ERROR",
      },
      { status: 500 }
    );
  }
}

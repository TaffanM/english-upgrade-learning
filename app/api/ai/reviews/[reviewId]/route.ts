import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAiReviewByIdForUser } from "@/lib/ai/review-service";
import { AiReviewServiceError } from "@/lib/ai/types";

const uuidParamSchema = z.string().uuid("Invalid review ID");

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await context.params;
    const validId = uuidParamSchema.safeParse(reviewId);
    if (!validId.success) {
      return NextResponse.json(
        { error: "Invalid review ID.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

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

    const review = await getAiReviewByIdForUser({
      supabase,
      userId: user.id,
      reviewId: validId.data,
    });

    return NextResponse.json({ review }, { status: 200 });
  } catch (err) {
    if (err instanceof AiReviewServiceError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to retrieve AI review.", code: "DATABASE_ERROR" },
      { status: 500 }
    );
  }
}

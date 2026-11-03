import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeSpeakingSubmission } from "@/lib/stt/stt-service";
import { SttServiceError } from "@/lib/stt/types";

// Allow up to 60 seconds on Vercel Serverless Functions to prevent 504 timeouts during audio transcription
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

    const result = await transcribeSpeakingSubmission({
      supabase,
      userId: user.id,
      rawInput: body,
    });

    return NextResponse.json(result, {
      status: result.cached ? 200 : 201,
    });
  } catch (err) {
    if (err instanceof SttServiceError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }
    return NextResponse.json(
      {
        error: "An unexpected error occurred during speech transcription.",
        code: "STT_PROVIDER_ERROR",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getSpeakingTranscriptionForUser,
  saveEditedSpeakingTranscript,
} from "@/lib/stt/stt-service";
import { SttServiceError } from "@/lib/stt/types";

const uuidParamSchema = z.string().uuid("Invalid submission ID");

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await context.params;
    const validId = uuidParamSchema.safeParse(submissionId);
    if (!validId.success) {
      return NextResponse.json(
        { error: "Invalid submission ID.", code: "INVALID_INPUT" },
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

    const transcription = await getSpeakingTranscriptionForUser({
      supabase,
      userId: user.id,
      submissionId: validId.data,
    });

    return NextResponse.json({ transcription }, { status: 200 });
  } catch (err) {
    if (err instanceof SttServiceError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to load transcription.", code: "DATABASE_ERROR" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await context.params;
    const validId = uuidParamSchema.safeParse(submissionId);
    if (!validId.success) {
      return NextResponse.json(
        { error: "Invalid submission ID.", code: "INVALID_INPUT" },
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const transcription = await saveEditedSpeakingTranscript({
      supabase,
      userId: user.id,
      submissionId: validId.data,
      rawInput: body,
    });

    return NextResponse.json({ transcription }, { status: 200 });
  } catch (err) {
    if (err instanceof SttServiceError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }
    return NextResponse.json(
      { error: "Failed to save edited transcript.", code: "DATABASE_ERROR" },
      { status: 500 }
    );
  }
}

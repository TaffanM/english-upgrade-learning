import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "@/types/database.types";
import { countWords } from "@/lib/utils/word-count";
import {
  SpeechToTextProvider,
  SttServiceError,
  TranscriptionRecordDTO,
  TranscriptionStatus,
  WordTimestamp,
} from "./types";
import { getConfiguredSttProvider } from "./stt-provider";
import {
  createTranscriptionRequestSchema,
  updateTranscriptionRequestSchema,
} from "./schemas";

const MAX_AUDIO_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_AUDIO_DURATION_SECONDS = 20 * 60; // 20 minutes
const MAX_TRANSCRIPTIONS_PER_HOUR = 20;
const RETRANSCRIBE_COOLDOWN_MS = 20_000; // 20 seconds

// In-flight deduplication lock keyed by submissionId
const inFlightTranscriptions = new Set<string>();

type SubmissionRow = Database["public"]["Tables"]["activity_submissions"]["Row"];

export function mapSubmissionToTranscriptionDTO(
  submission: SubmissionRow
): TranscriptionRecordDTO {
  const edited = submission.edited_transcript?.trim() || null;
  const original = submission.original_transcript?.trim() || null;
  const activeTranscript = edited ?? original ?? null;
  const wordCount = activeTranscript ? countWords(activeTranscript) : 0;

  let wordTimestamps: WordTimestamp[] | null = null;
  if (Array.isArray(submission.transcript_word_timestamps)) {
    wordTimestamps =
      submission.transcript_word_timestamps as unknown as WordTimestamp[];
  }

  return {
    submissionId: submission.id,
    status: (submission.transcription_status || "none") as TranscriptionStatus,
    originalTranscript: original,
    editedTranscript: edited,
    activeTranscript,
    wordCount,
    provider: submission.transcription_provider,
    model: submission.transcription_model,
    transcribedAt: submission.transcribed_at,
    wordTimestamps,
    error: submission.transcription_error,
  };
}

export async function getSpeakingTranscriptionForUser(params: {
  supabase: SupabaseClient<Database>;
  userId: string;
  submissionId: string;
}): Promise<TranscriptionRecordDTO> {
  const { supabase, userId, submissionId } = params;

  const { data: submission, error } = await supabase
    .from("activity_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (error || !submission) {
    throw new SttServiceError(
      "NOT_FOUND",
      "Speaking submission not found.",
      404
    );
  }

  if (submission.user_id !== userId) {
    throw new SttServiceError(
      "FORBIDDEN",
      "You do not have permission to access this submission.",
      403
    );
  }

  return mapSubmissionToTranscriptionDTO(submission);
}

export async function transcribeSpeakingSubmission(params: {
  supabase: SupabaseClient<Database>;
  userId: string;
  rawInput: unknown;
  providerOverride?: SpeechToTextProvider;
}): Promise<{ transcription: TranscriptionRecordDTO; cached: boolean }> {
  const { supabase, userId, rawInput, providerOverride } = params;

  const parsedInput = createTranscriptionRequestSchema.safeParse(rawInput);
  if (!parsedInput.success) {
    throw new SttServiceError(
      "INVALID_INPUT",
      parsedInput.error.issues[0]?.message || "Invalid transcription request.",
      400
    );
  }

  const { submissionId, forceRetranscribe } = parsedInput.data;

  if (inFlightTranscriptions.has(submissionId)) {
    throw new SttServiceError(
      "DUPLICATE_IN_FLIGHT",
      "Transcription is already in progress for this recording.",
      409
    );
  }

  // Fetch submission & verify ownership
  const { data: submission, error: subError } = await supabase
    .from("activity_submissions")
    .select("*, activities(activity_type)")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError || !submission) {
    throw new SttServiceError(
      "NOT_FOUND",
      "Speaking submission not found.",
      404
    );
  }

  if (submission.user_id !== userId) {
    throw new SttServiceError(
      "FORBIDDEN",
      "You do not own this speaking submission.",
      403
    );
  }

  const activityMeta = submission.activities as unknown as {
    activity_type?: string;
  } | null;
  if (activityMeta?.activity_type && activityMeta.activity_type !== "speaking") {
    throw new SttServiceError(
      "INVALID_INPUT",
      "Only speaking submissions can be transcribed.",
      422
    );
  }

  // Return existing cached transcript unless forceRetranscribe is requested
  if (
    !forceRetranscribe &&
    submission.original_transcript &&
    (submission.transcription_status === "completed" ||
      submission.transcription_status === "edited")
  ) {
    return {
      transcription: mapSubmissionToTranscriptionDTO(submission),
      cached: true,
    };
  }

  // Enforce cooldown on forced re-transcriptions
  if (forceRetranscribe && submission.transcribed_at) {
    const elapsedMs =
      Date.now() - new Date(submission.transcribed_at).getTime();
    if (elapsedMs < RETRANSCRIBE_COOLDOWN_MS) {
      throw new SttServiceError(
        "RATE_LIMITED",
        "Please wait a few seconds before retrying transcription.",
        429
      );
    }
  }

  // Verify hourly rate limit for user
  const oneHourAgoIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("activity_submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("transcribed_at", oneHourAgoIso);

  if ((recentCount ?? 0) >= MAX_TRANSCRIPTIONS_PER_HOUR) {
    throw new SttServiceError(
      "RATE_LIMITED",
      "Hourly transcription limit reached. You can still type or edit your transcript manually.",
      429
    );
  }

  // Validate storage path ownership and recording presence
  if (!submission.storage_path || !submission.storage_bucket) {
    throw new SttServiceError(
      "NO_AUDIO_RECORDING",
      "This speaking submission has no audio file to transcribe. You can enter your transcript manually.",
      422
    );
  }

  if (!submission.storage_path.startsWith(`${userId}/`)) {
    throw new SttServiceError(
      "FORBIDDEN",
      "Invalid audio storage ownership path.",
      403
    );
  }

  // Validate size and duration limits
  if (
    submission.file_size_bytes &&
    submission.file_size_bytes > MAX_AUDIO_FILE_SIZE_BYTES
  ) {
    throw new SttServiceError(
      "AUDIO_TOO_LARGE",
      "Audio file exceeds the 25 MB maximum size for transcription.",
      422
    );
  }

  if (
    submission.duration_seconds &&
    submission.duration_seconds > MAX_AUDIO_DURATION_SECONDS
  ) {
    throw new SttServiceError(
      "AUDIO_TOO_LONG",
      "Audio recording exceeds the 20-minute maximum duration for transcription.",
      422
    );
  }

  inFlightTranscriptions.add(submissionId);

  try {
    // Mark status as processing
    await supabase
      .from("activity_submissions")
      .update({
        transcription_status: "processing",
        transcription_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .eq("user_id", userId);

    // Download audio from private Supabase Storage
    const { data: audioBlob, error: downloadError } = await supabase.storage
      .from(submission.storage_bucket)
      .download(submission.storage_path);

    if (downloadError || !audioBlob) {
      throw new SttServiceError(
        "STORAGE_DOWNLOAD_ERROR",
        "Could not retrieve the audio recording from private storage.",
        502
      );
    }

    const arrayBuf = await audioBlob.arrayBuffer();
    if (arrayBuf.byteLength > MAX_AUDIO_FILE_SIZE_BYTES) {
      throw new SttServiceError(
        "AUDIO_TOO_LARGE",
        "Downloaded audio exceeds the 25 MB limit.",
        422
      );
    }

    const provider = providerOverride ?? getConfiguredSttProvider();
    const ext = submission.storage_path.split(".").pop() || "wav";
    const fileName = `submission-${submissionId}.${ext}`;
    const mimeType = submission.mime_type || audioBlob.type || "audio/wav";

    const sttResult = await provider.transcribeAudio({
      audioBuffer: Buffer.from(arrayBuf),
      mimeType,
      fileName,
    });

    const cleanTranscript = sttResult.transcript.trim();
    const nextEditedTranscript =
      submission.transcription_status === "edited" &&
      submission.edited_transcript &&
      !forceRetranscribe
        ? submission.edited_transcript
        : cleanTranscript;

    const wordCount = countWords(nextEditedTranscript);
    const nowIso = new Date().toISOString();

    const { data: updatedSubmission, error: updateError } = await supabase
      .from("activity_submissions")
      .update({
        original_transcript: cleanTranscript,
        edited_transcript: nextEditedTranscript,
        word_count: wordCount,
        transcription_status: "completed",
        transcription_provider: sttResult.provider,
        transcription_model: sttResult.model,
        transcribed_at: nowIso,
        transcript_word_timestamps: (sttResult.wordTimestamps ??
          null) as unknown as Json,
        transcription_error: null,
        updated_at: nowIso,
      })
      .eq("id", submissionId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError || !updatedSubmission) {
      throw new SttServiceError(
        "DATABASE_ERROR",
        "Failed to save generated transcript to the database.",
        500
      );
    }

    return {
      transcription: mapSubmissionToTranscriptionDTO(updatedSubmission),
      cached: false,
    };
  } catch (err) {
    const errorMsg =
      err instanceof SttServiceError
        ? err.message
        : "Speech-to-text transcription failed.";

    // Record failure state without overwriting any existing transcript
    await supabase
      .from("activity_submissions")
      .update({
        transcription_status: submission.original_transcript
          ? submission.transcription_status
          : "failed",
        transcription_error: errorMsg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .eq("user_id", userId);

    if (err instanceof SttServiceError) {
      throw err;
    }
    throw new SttServiceError("STT_PROVIDER_ERROR", errorMsg, 502);
  } finally {
    inFlightTranscriptions.delete(submissionId);
  }
}

export async function saveEditedSpeakingTranscript(params: {
  supabase: SupabaseClient<Database>;
  userId: string;
  submissionId: string;
  rawInput: unknown;
}): Promise<TranscriptionRecordDTO> {
  const { supabase, userId, submissionId, rawInput } = params;

  const parsed = updateTranscriptionRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new SttServiceError(
      "INVALID_INPUT",
      parsed.error.issues[0]?.message || "Invalid transcript text.",
      400
    );
  }

  const { data: submission, error: subError } = await supabase
    .from("activity_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (subError || !submission) {
    throw new SttServiceError(
      "NOT_FOUND",
      "Speaking submission not found.",
      404
    );
  }

  if (submission.user_id !== userId) {
    throw new SttServiceError(
      "FORBIDDEN",
      "You do not have permission to edit this transcript.",
      403
    );
  }

  const editedText = parsed.data.editedTranscript.trim();
  const wordCount = countWords(editedText);
  const nowIso = new Date().toISOString();

  // Never overwrite original_transcript if it already exists
  const updatePayload: Database["public"]["Tables"]["activity_submissions"]["Update"] =
    {
      edited_transcript: editedText,
      word_count: wordCount,
      transcription_status: "edited",
      transcription_error: null,
      updated_at: nowIso,
    };

  if (!submission.original_transcript) {
    // If learner typed transcript manually after a failed/unavailable STT run,
    // record provider as "manual" while leaving original_transcript null to distinguish ASR vs manual.
    updatePayload.transcription_provider =
      submission.transcription_provider || "manual";
    updatePayload.transcribed_at = submission.transcribed_at || nowIso;
  }

  const { data: updated, error: updateError } = await supabase
    .from("activity_submissions")
    .update(updatePayload)
    .eq("id", submissionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new SttServiceError(
      "DATABASE_ERROR",
      "Failed to save the edited transcript.",
      500
    );
  }

  return mapSubmissionToTranscriptionDTO(updated);
}

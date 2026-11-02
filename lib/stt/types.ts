export type TranscriptionStatus =
  | "none"
  | "processing"
  | "completed"
  | "edited"
  | "failed";

export type SttProviderName = "nvidia" | "groq";

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface SttProviderResult {
  transcript: string;
  provider: SttProviderName;
  model: string;
  wordTimestamps?: WordTimestamp[];
}

export interface SpeechToTextProvider {
  readonly providerName: SttProviderName;
  readonly modelName: string;
  transcribeAudio(params: {
    audioBuffer: Buffer | Uint8Array;
    mimeType: string;
    fileName: string;
  }): Promise<SttProviderResult>;
}

export interface TranscriptionRecordDTO {
  submissionId: string;
  status: TranscriptionStatus;
  originalTranscript: string | null;
  editedTranscript: string | null;
  activeTranscript: string | null;
  wordCount: number;
  provider: string | null;
  model: string | null;
  transcribedAt: string | null;
  wordTimestamps: WordTimestamp[] | null;
  error: string | null;
}

export type SttErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "NO_AUDIO_RECORDING"
  | "AUDIO_TOO_LARGE"
  | "AUDIO_TOO_LONG"
  | "DUPLICATE_IN_FLIGHT"
  | "RATE_LIMITED"
  | "QUOTA_EXHAUSTED"
  | "STT_PROVIDER_ERROR"
  | "STORAGE_DOWNLOAD_ERROR"
  | "DATABASE_ERROR";

export class SttServiceError extends Error {
  public readonly code: SttErrorCode;
  public readonly statusCode: number;

  constructor(code: SttErrorCode, message: string, statusCode: number) {
    super(message);
    this.name = "SttServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

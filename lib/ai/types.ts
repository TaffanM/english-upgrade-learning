export type AiReviewType = "writing" | "speaking";

export type AiCorrectionCategory =
  | "grammar"
  | "vocabulary"
  | "coherence"
  | "style"
  | "word_choice"
  | "sentence_structure"
  | "filler_repetition";

export interface AiCorrectionItem {
  original: string;
  corrected: string;
  explanation: string;
  category: AiCorrectionCategory;
}

export interface AiReviewScores {
  grammar: number;
  vocabulary: number;
  coherence: number;
  taskAchievement: number;
}

export interface AiRecommendedPracticeItem {
  skill: string;
  instruction: string;
}

export interface AiEvaluationResult {
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  corrections: AiCorrectionItem[];
  scores: AiReviewScores;
  recommendedPractice: AiRecommendedPracticeItem[];
}

export interface AiReviewRecordDTO extends AiEvaluationResult {
  id: string;
  submissionId: string;
  reviewType: AiReviewType;
  modelName: string;
  reviewVersion: number;
  overallScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumEvaluationContext {
  reviewType: AiReviewType;
  dayNumber: number;
  dayTitle: string | null;
  dayIntro: string | null;
  phaseNumber: number | null;
  phaseTitle: string | null;
  phaseFocus: string | null;
  sourceLevel: string;
  targetLevel: string;
  activityTitle: string;
  prompt: string;
  instructions: string | null;
  targetWordCount: number | null;
  minimumWordCount: number | null;
  maximumWordCount: number | null;
  checklistLabels: string[];
  learnerText: string;
  actualWordCount: number;
  durationSeconds?: number | null;
}

export interface AiChatMessage {
  role: "system" | "user";
  content: string;
}

export interface AiEvaluationProvider {
  readonly modelName: string;
  generateEvaluation(messages: AiChatMessage[]): Promise<{
    rawContent: string;
    modelName: string;
  }>;
}

export type AiReviewErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "SUBMISSION_NOT_SUBMITTED"
  | "SUBMISSION_TOO_LONG"
  | "TRANSCRIPT_MISSING"
  | "DUPLICATE_IN_FLIGHT"
  | "RATE_LIMITED"
  | "QUOTA_EXHAUSTED"
  | "PROVIDER_ERROR"
  | "PROVIDER_TIMEOUT"
  | "INVALID_MODEL_OUTPUT"
  | "DATABASE_ERROR";

export class AiReviewServiceError extends Error {
  public readonly code: AiReviewErrorCode;
  public readonly statusCode: number;

  constructor(code: AiReviewErrorCode, message: string, statusCode: number) {
    super(message);
    this.name = "AiReviewServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

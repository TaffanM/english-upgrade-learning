import { z } from "zod";

export const createTranscriptionRequestSchema = z.object({
  submissionId: z.string().uuid("Invalid submission ID"),
  forceRetranscribe: z.boolean().optional().default(false),
});

export type CreateTranscriptionRequest = z.infer<
  typeof createTranscriptionRequestSchema
>;

export const updateTranscriptionRequestSchema = z.object({
  editedTranscript: z
    .string()
    .trim()
    .min(5, "Transcript must contain at least 5 characters")
    .max(10000, "Transcript cannot exceed 10,000 characters"),
});

export type UpdateTranscriptionRequest = z.infer<
  typeof updateTranscriptionRequestSchema
>;

export const wordTimestampSchema = z.object({
  word: z.string(),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
});

export const providerTranscriptionResponseSchema = z.object({
  text: z.string().trim().min(1, "Transcription provider returned empty text"),
  words: z
    .array(
      z.object({
        word: z.string(),
        start: z.number().optional(),
        end: z.number().optional(),
        start_time: z.number().optional(),
        end_time: z.number().optional(),
      })
    )
    .optional(),
});

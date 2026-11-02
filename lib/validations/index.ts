import { z } from "zod";

/**
 * Standard PostgreSQL UUID format (8-4-4-4-12 hex characters).
 * Permissive to any valid 128-bit hex UUID representation used in Postgres.
 */
export const postgresUuidRegex =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const uuidSchema = (message = "Invalid UUID") =>
  z.string().regex(postgresUuidRegex, message);

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const saveWritingDraftSchema = z.object({
  activityId: uuidSchema("Invalid activity ID"),
  textContent: z.string(),
});

export const submitWritingSchema = z.object({
  activityId: uuidSchema("Invalid activity ID"),
  textContent: z.string().min(10, "Writing submission must not be empty"),
  dayNumber: z.number().int().positive(),
});

export const submitSpeakingSchema = z.object({
  activityId: uuidSchema("Invalid activity ID"),
  dayNumber: z.number().int().positive(),
  storagePath: z.string().min(1, "Storage path is required"),
  durationSeconds: z.number().int().nonnegative().optional(),
  fileSizeBytes: z.number().int().nonnegative().optional(),
  mimeType: z.string().optional(),
});

export const submitAlternativeSpeakingSchema = z.object({
  activityId: uuidSchema("Invalid activity ID"),
  dayNumber: z.number().int().positive(),
  notes: z.string().min(10, "Please provide reflection notes about your speaking session"),
});

export const selfAssessmentSchema = z.object({
  challengeDayId: uuidSchema("Invalid challenge day ID"),
  activityType: z.enum(["speaking", "writing"]).optional(),
  fluencyScore: z.number().int().min(1).max(5).optional(),
  grammarScore: z.number().int().min(1).max(5).optional(),
  vocabularyScore: z.number().int().min(1).max(5).optional(),
  organizationScore: z.number().int().min(1).max(5).optional(),
  confidenceScore: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export const weeklyReviewSchema = z.object({
  phaseId: uuidSchema("Invalid phase ID"),
  challengeId: uuidSchema("Invalid challenge ID"),
  reflection: z.string().min(20, "Please write a substantive reflection on your week"),
  fluencyScore: z.number().int().min(1).max(5).optional(),
  grammarScore: z.number().int().min(1).max(5).optional(),
  vocabularyScore: z.number().int().min(1).max(5).optional(),
  organizationScore: z.number().int().min(1).max(5).optional(),
  confidenceScore: z.number().int().min(1).max(5).optional(),
  evidenceNotes: z.string().optional(),
});

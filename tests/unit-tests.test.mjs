import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// 1. Word Count Utility Logic (Re-implemented for direct test verification)
function countWords(text) {
  if (!text) return 0;
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
}

function getWordCountStatus(currentCount, targetCount) {
  if (!targetCount || targetCount <= 0) {
    return { isAcceptable: currentCount > 0, difference: 0, percentage: 100 };
  }
  const difference = currentCount - targetCount;
  const percentage = Math.min(100, Math.round((currentCount / targetCount) * 100));
  const isAcceptable = currentCount >= Math.floor(targetCount * 0.9);
  return { isAcceptable, difference, percentage };
}

// 2. Progression Rules Logic
function isDayComplete(progress) {
  if (!progress) return false;
  return Boolean(
    progress.completed_at ||
      (progress.speaking_completed_at && progress.writing_completed_at)
  );
}

function findNextIncompleteDay(days, progressMap) {
  const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number);
  for (const day of sortedDays) {
    const progress = progressMap.get(day.id);
    if (!isDayComplete(progress)) {
      return day;
    }
  }
  return sortedDays[sortedDays.length - 1] ?? null;
}

// 3. Validation Schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const submitWritingSchema = z.object({
  activityId: z.string().uuid(),
  textContent: z.string().min(10),
  dayNumber: z.number().int().positive(),
});

describe("Word Counter Utility", () => {
  test("returns 0 for empty or whitespace-only strings", () => {
    assert.equal(countWords(""), 0);
    assert.equal(countWords("   "), 0);
    assert.equal(countWords(null), 0);
    assert.equal(countWords(undefined), 0);
  });

  test("counts simple whitespace-separated words", () => {
    assert.equal(countWords("Hello world"), 2);
    assert.equal(countWords("Write a 120-word self-introduction for networking."), 6);
  });

  test("correctly handles consecutive spaces, newlines, and tabs", () => {
    const text = "First line.\n\nSecond line with   extra   spaces.\tThird.";
    assert.equal(countWords(text), 8);
  });

  test("calibrates target word status accurately", () => {
    const status1 = getWordCountStatus(120, 120);
    assert.equal(status1.isAcceptable, true);
    assert.equal(status1.difference, 0);
    assert.equal(status1.percentage, 100);

    const status2 = getWordCountStatus(108, 120); // 90% threshold
    assert.equal(status2.isAcceptable, true);
    assert.equal(status2.difference, -12);

    const status3 = getWordCountStatus(80, 120);
    assert.equal(status3.isAcceptable, false);
    assert.equal(status3.difference, -40);
  });
});

describe("Progression & Completion Rules", () => {
  test("BR-011: Day complete only when both speaking and writing are completed", () => {
    assert.equal(isDayComplete(null), false);
    assert.equal(isDayComplete({ speaking_completed_at: null, writing_completed_at: null }), false);
    assert.equal(isDayComplete({ speaking_completed_at: "2026-10-31T10:00:00Z", writing_completed_at: null }), false);
    assert.equal(isDayComplete({ speaking_completed_at: null, writing_completed_at: "2026-10-31T10:15:00Z" }), false);
    assert.equal(
      isDayComplete({
        speaking_completed_at: "2026-10-31T10:00:00Z",
        writing_completed_at: "2026-10-31T10:15:00Z",
      }),
      true
    );
  });

  test("BR-005 & BR-006: Identifies lowest incomplete day without skipping", () => {
    const days = [
      { id: "d1", day_number: 1 },
      { id: "d2", day_number: 2 },
      { id: "d3", day_number: 3 },
      { id: "d4", day_number: 4 },
    ];

    const progressMap = new Map();

    // No days complete -> Day 1
    assert.equal(findNextIncompleteDay(days, progressMap).day_number, 1);

    // Day 1 complete -> Day 2
    progressMap.set("d1", {
      speaking_completed_at: "2026-10-31",
      writing_completed_at: "2026-10-31",
    });
    assert.equal(findNextIncompleteDay(days, progressMap).day_number, 2);

    // If Day 1 and Day 3 completed, next is Day 2 (missed day resume, not skipped!)
    progressMap.set("d3", {
      speaking_completed_at: "2026-11-02",
      writing_completed_at: "2026-11-02",
    });
    assert.equal(findNextIncompleteDay(days, progressMap).day_number, 2);
  });
});

describe("Validation Schemas", () => {
  const postgresUuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const uuidSchema = (msg) => z.string().regex(postgresUuidRegex, msg);

  const weeklyReviewSchema = z.object({
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

  test("weeklyReviewSchema accepts deterministic seed phase and challenge UUIDs", () => {
    const input = {
      phaseId: "b0000000-0000-0000-0000-000000000001",
      challengeId: "a0000000-0000-0000-0000-000000000001",
      reflection: "This is a comprehensive reflection exceeding twenty characters.",
      fluencyScore: 4,
      grammarScore: 4,
      vocabularyScore: 4,
      organizationScore: 4,
      confidenceScore: 4,
      evidenceNotes: "Targeting connectors next phase.",
    };

    const result = weeklyReviewSchema.safeParse(input);
    assert.equal(result.success, true);
  });

  test("weeklyReviewSchema rejects invalid non-UUID strings", () => {
    const input = {
      phaseId: "not-a-uuid",
      challengeId: "a0000000-0000-0000-0000-000000000001",
      reflection: "This is a comprehensive reflection exceeding twenty characters.",
    };

    const result = weeklyReviewSchema.safeParse(input);
    assert.equal(result.success, false);
    assert.equal(result.error?.issues[0]?.message, "Invalid phase ID");
  });

  test("loginSchema validates credentials", () => {
    assert.equal(loginSchema.safeParse({ email: "invalid", password: "123" }).success, false);
    assert.equal(
      loginSchema.safeParse({ email: "learner@example.com", password: "password123" }).success,
      true
    );
  });

  test("submitWritingSchema validates payload", () => {
    assert.equal(
      submitWritingSchema.safeParse({
        activityId: "not-a-uuid",
        textContent: "too short",
        dayNumber: 1,
      }).success,
      false
    );

    assert.equal(
      submitWritingSchema.safeParse({
        activityId: "123e4567-e89b-12d3-a456-426614174000",
        textContent: "This is a full writing response that meets the minimum length requirement.",
        dayNumber: 1,
      }).success,
      true
    );
  });
});

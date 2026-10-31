import { Database } from "@/types/database.types";

type ChallengeDay = Database["public"]["Tables"]["challenge_days"]["Row"];
type DailyProgress = Database["public"]["Tables"]["daily_progress"]["Row"];
type Phase = Database["public"]["Tables"]["phases"]["Row"];

export interface DayWithProgress {
  day: ChallengeDay;
  progress?: DailyProgress;
  isComplete: boolean;
  speakingComplete: boolean;
  writingComplete: boolean;
}

/**
 * Determines whether a day is fully completed.
 * BR-011: Both speaking and writing must be complete.
 */
export function isDayComplete(progress?: DailyProgress | null): boolean {
  if (!progress) return false;
  return Boolean(
    progress.completed_at ||
      (progress.speaking_completed_at && progress.writing_completed_at)
  );
}

/**
 * BR-005: Finds the next incomplete challenge day by lowest day_number.
 * Calendar date does not force skipping; learner resumes from the lowest incomplete day.
 */
export function findNextIncompleteDay(
  days: ChallengeDay[],
  progressMap: Map<string, DailyProgress>
): ChallengeDay | null {
  const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number);

  for (const day of sortedDays) {
    const progress = progressMap.get(day.id);
    if (!isDayComplete(progress)) {
      return day;
    }
  }

  // All completed, return the last day
  return sortedDays[sortedDays.length - 1] ?? null;
}

/**
 * Calculates overall challenge statistics
 */
export function calculateChallengeStats(
  days: ChallengeDay[],
  progressList: DailyProgress[]
) {
  const progressMap = new Map<string, DailyProgress>(
    progressList.map((p) => [p.challenge_day_id, p])
  );

  let completedDaysCount = 0;
  let speakingCompletedCount = 0;
  let writingCompletedCount = 0;

  for (const day of days) {
    const p = progressMap.get(day.id);
    if (p) {
      if (p.speaking_completed_at) speakingCompletedCount++;
      if (p.writing_completed_at) writingCompletedCount++;
      if (isDayComplete(p)) completedDaysCount++;
    }
  }

  const totalDays = days.length || 41;
  const percentage = Math.round((completedDaysCount / totalDays) * 100);

  return {
    totalDays,
    completedDaysCount,
    speakingCompletedCount,
    writingCompletedCount,
    percentage,
  };
}

/**
 * Groups challenge days by their respective phase
 */
export function groupDaysByPhase(
  phases: Phase[],
  days: ChallengeDay[],
  progressMap: Map<string, DailyProgress>
) {
  const sortedPhases = [...phases].sort(
    (a, b) => a.phase_number - b.phase_number
  );
  const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number);

  return sortedPhases.map((phase) => {
    const phaseDays = sortedDays.filter(
      (day) => day.phase_id === phase.id || (day.day_number >= phase.start_day && day.day_number <= phase.end_day)
    );

    const completedInPhase = phaseDays.filter((d) =>
      isDayComplete(progressMap.get(d.id))
    ).length;

    const phasePercentage = phaseDays.length
      ? Math.round((completedInPhase / phaseDays.length) * 100)
      : 0;

    return {
      phase,
      days: phaseDays.map((day) => ({
        day,
        progress: progressMap.get(day.id),
        isComplete: isDayComplete(progressMap.get(day.id)),
        speakingComplete: Boolean(progressMap.get(day.id)?.speaking_completed_at),
        writingComplete: Boolean(progressMap.get(day.id)?.writing_completed_at),
      })),
      completedCount: completedInPhase,
      totalCount: phaseDays.length,
      percentage: phasePercentage,
    };
  });
}

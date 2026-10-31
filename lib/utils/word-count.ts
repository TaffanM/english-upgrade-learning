/**
 * Calculates the number of words in a given text based on whitespace separation.
 * Consistent server and client word-counting standard.
 */
export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
}

/**
 * Validates word count against minimum or target constraints.
 */
export function getWordCountStatus(
  currentCount: number,
  targetCount: number | null | undefined
): {
  isAcceptable: boolean;
  difference: number;
  percentage: number;
} {
  if (!targetCount || targetCount <= 0) {
    return {
      isAcceptable: currentCount > 0,
      difference: 0,
      percentage: 100,
    };
  }

  const difference = currentCount - targetCount;
  const percentage = Math.min(100, Math.round((currentCount / targetCount) * 100));

  // Acceptable if within 10% below or any amount above target
  const isAcceptable = currentCount >= Math.floor(targetCount * 0.9);

  return {
    isAcceptable,
    difference,
    percentage,
  };
}

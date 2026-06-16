export const DEFAULT_REVIEW_INTERVALS = [1, 7, 30] as const;
export const DEFAULT_REVIEW_MINUTES = 30;

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

export function parseReviewIntervals(value?: string | null) {
  const source = value?.trim() || DEFAULT_REVIEW_INTERVALS.join(",");
  const days = source
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((day) => Number.isFinite(day));

  if (
    days.length === 0 ||
    days.some((day) => !Number.isInteger(day) || day < 1 || day > 365)
  ) {
    throw new Error("Intervalos de revisão inválidos.");
  }

  return [...new Set(days)].sort((first, second) => first - second);
}

export function normalizeReviewIntervals(value?: string | null) {
  return parseReviewIntervals(value).join(",");
}

export function reviewIntervalLabel(days: number) {
  return days === 1 ? "1 dia" : `${days} dias`;
}

export function reviewIntervalsSummary(value?: string | null) {
  const labels = parseReviewIntervals(value).map(reviewIntervalLabel);
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} e ${labels.at(-1)}`;
}

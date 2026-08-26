export type ReviewRating = "AGAIN" | "HARD" | "GOOD" | "EASY";

export interface SrsState {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
}

export interface SrsResult extends SrsState {
  nextReviewDate: Date;
}

/** Anki-style 4-button rating mapped onto the SM-2 0-5 quality scale. */
const QUALITY_BY_RATING: Record<ReviewRating, number> = {
  AGAIN: 2,
  HARD: 3,
  GOOD: 4,
  EASY: 5,
};

const MIN_EASE_FACTOR = 1.3;

/**
 * Simplified SM-2. On a lapse (quality < 3) repetitions reset and the card
 * is due again the next day; otherwise the interval grows by the ease
 * factor, which itself is nudged up/down based on how easy the review felt.
 */
export function computeNextReview(state: SrsState, rating: ReviewRating, now: Date = new Date()): SrsResult {
  const quality = QUALITY_BY_RATING[rating];
  const { repetitions, intervalDays, easeFactor } = state;

  const nextEase = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  let nextInterval: number;
  let nextRepetitions: number;

  if (quality < 3) {
    nextRepetitions = 0;
    nextInterval = 1;
  } else {
    nextRepetitions = repetitions + 1;
    if (nextRepetitions === 1) nextInterval = 1;
    else if (nextRepetitions === 2) nextInterval = 6;
    else nextInterval = Math.round(intervalDays * nextEase);
  }

  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  return {
    repetitions: nextRepetitions,
    intervalDays: nextInterval,
    easeFactor: nextEase,
    nextReviewDate,
  };
}

export function initialSrsState(): SrsState {
  return { repetitions: 0, intervalDays: 0, easeFactor: 2.5 };
}

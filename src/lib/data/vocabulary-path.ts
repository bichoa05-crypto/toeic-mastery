import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getOverallStats } from "@/lib/data/skill-stats";
import { computeXp, getXpProgress } from "@/lib/services/xp";
import type { StudyItem } from "@/lib/services/study-game";

const PATH_SLUG = "toeic-20-day";
const STEPS_PER_DAY = 3;

export interface PathDaySummary {
  dayNumber: number;
  tierLabel: string;
  wordCount: number;
  topicNames: string[];
  stepsCompleted: number;
  stars: number;
  isCompleted: boolean;
  isUnlocked: boolean;
}

/** Everything the /vocabulary/path overview page needs in one call: the
 * day list (with per-day lock/progress state derived from sequential
 * completion) grouped by tier, which day is "today"'s target, and the same
 * XP/rank the dashboard shows — this path doesn't have its own separate XP
 * pool, it's just another view onto the account's real XP. */
export async function getVocabularyPathOverview(userId: string) {
  const path = await db.vocabularyPath.findUnique({
    where: { slug: PATH_SLUG },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          words: { include: { word: { select: { topicId: true, topic: { select: { name: true } } } } } },
          progress: { where: { userId } },
        },
      },
    },
  });
  if (!path) notFound();

  let previousCompleted = true;
  const days: PathDaySummary[] = path.days.map((day) => {
    const progress = day.progress[0];
    const stepsCompleted = progress?.stepsCompleted ?? 0;
    const isCompleted = stepsCompleted >= STEPS_PER_DAY;
    const isUnlocked = previousCompleted;
    previousCompleted = isCompleted;

    const topicNames = [...new Set(day.words.map((w) => w.word.topic.name))];

    return {
      dayNumber: day.dayNumber,
      tierLabel: day.tierLabel,
      wordCount: day.words.length,
      topicNames,
      stepsCompleted,
      stars: progress?.stars ?? 0,
      isCompleted,
      isUnlocked,
    };
  });

  const totalWords = days.reduce((sum, d) => sum + d.wordCount, 0);
  const daysCompleted = days.filter((d) => d.isCompleted).length;
  const currentDay = days.find((d) => d.isUnlocked && !d.isCompleted) ?? days[days.length - 1];

  const [profile, overallStats] = await Promise.all([
    db.profile.findUniqueOrThrow({ where: { id: userId }, select: { streakCount: true } }),
    getOverallStats(userId),
  ]);
  const xp = computeXp(overallStats, profile.streakCount);
  const xpProgress = getXpProgress(xp);

  const tiers = new Map<string, PathDaySummary[]>();
  for (const day of days) {
    const bucket = tiers.get(day.tierLabel);
    if (bucket) bucket.push(day);
    else tiers.set(day.tierLabel, [day]);
  }

  return {
    title: path.title,
    description: path.description,
    totalDays: days.length,
    totalWords,
    daysCompleted,
    currentDay,
    tiers: [...tiers.entries()].map(([label, dayList]) => ({ label, days: dayList })),
    xpProgress,
  };
}

export interface PathDayDetail {
  dayId: string;
  dayNumber: number;
  tierLabel: string;
  totalDays: number;
  isUnlocked: boolean;
  stepsCompleted: number;
  stars: number;
  items: StudyItem[];
}

/** A single day's detail for the runner page — 404s for an out-of-range day
 * number rather than exposing an empty/locked shell. */
export async function getPathDayDetail(dayNumber: number, userId: string): Promise<PathDayDetail> {
  const path = await db.vocabularyPath.findUnique({
    where: { slug: PATH_SLUG },
    include: { days: { orderBy: { dayNumber: "asc" }, include: { progress: { where: { userId } } } } },
  });
  if (!path) notFound();

  const dayIndex = path.days.findIndex((d) => d.dayNumber === dayNumber);
  if (dayIndex === -1) notFound();

  const isUnlocked = dayIndex === 0 || (path.days[dayIndex - 1].progress[0]?.stepsCompleted ?? 0) >= STEPS_PER_DAY;

  const dayWithWords = await db.vocabularyPathDay.findUniqueOrThrow({
    where: { id: path.days[dayIndex].id },
    include: { words: { orderBy: { orderIndex: "asc" }, include: { word: true } } },
  });

  const progress = path.days[dayIndex].progress[0];

  return {
    dayId: dayWithWords.id,
    dayNumber,
    tierLabel: dayWithWords.tierLabel,
    totalDays: path.days.length,
    isUnlocked,
    stepsCompleted: progress?.stepsCompleted ?? 0,
    stars: progress?.stars ?? 0,
    items: dayWithWords.words.map((w) => ({
      id: w.word.id,
      term: w.word.word,
      ipa: w.word.ipa,
      partOfSpeech: w.word.partOfSpeech,
      meaningVi: w.word.meaningVi,
      exampleEn: w.word.exampleEn,
      audioUrl: w.word.audioUrlUs ?? w.word.audioUrlUk,
    })),
  };
}

import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { StudyItem } from "@/lib/services/study-game";

export async function getVocabularyTopics() {
  return db.vocabularyTopic.findMany({
    orderBy: { orderIndex: "asc" },
    include: { _count: { select: { words: true } } },
  });
}

export async function getVocabularyOverview(userId: string) {
  const [topics, learnedCount, dueCount, totalUser] = await Promise.all([
    db.vocabularyTopic.count(),
    db.userVocabulary.count({ where: { userId, isLearned: true } }),
    db.userVocabulary.count({ where: { userId, nextReviewDate: { lte: new Date() } } }),
    db.userVocabulary.count({ where: { userId } }),
  ]);
  return { topicsCount: topics, learnedCount, dueCount, totalTracked: totalUser };
}

export async function getTopicWithWords(slug: string, userId: string) {
  const topic = await db.vocabularyTopic.findUnique({
    where: { slug },
    include: { words: { orderBy: { word: "asc" } } },
  });
  if (!topic) notFound();

  const tracked = await db.userVocabulary.findMany({
    where: { userId, vocabularyWordId: { in: topic.words.map((w) => w.id) } },
    select: { vocabularyWordId: true, isLearned: true },
  });
  const trackedMap = new Map(tracked.map((t) => [t.vocabularyWordId, t.isLearned]));

  return {
    topic,
    words: topic.words.map((w) => ({ ...w, isTracked: trackedMap.has(w.id), isLearned: trackedMap.get(w.id) ?? false })),
  };
}

/** Study/game items for one topic — every word, regardless of tracking
 * state (the flashcard/quiz/matching games are lightweight practice, not
 * the graded SRS review, so they don't require "starting to learn" first). */
export async function getTopicStudyItems(slug: string): Promise<{ topicName: string; items: StudyItem[] }> {
  const topic = await db.vocabularyTopic.findUnique({
    where: { slug },
    include: { words: { orderBy: { word: "asc" } } },
  });
  if (!topic) notFound();

  return {
    topicName: topic.name,
    items: topic.words.map((w) => ({
      id: w.id,
      term: w.word,
      ipa: w.ipa,
      partOfSpeech: w.partOfSpeech,
      meaningVi: w.meaningVi,
      exampleEn: w.exampleEn,
      audioUrl: w.audioUrlUs ?? w.audioUrlUk,
    })),
  };
}

export async function getDueReviewQueue(userId: string, limit = 30) {
  return db.userVocabulary.findMany({
    where: { userId, nextReviewDate: { lte: new Date() } },
    include: { vocabularyWord: true },
    orderBy: { nextReviewDate: "asc" },
    take: limit,
  });
}

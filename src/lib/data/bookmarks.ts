import "server-only";
import { db } from "@/lib/db";
import type { StudyItem } from "@/lib/services/study-game";

export async function getBookmarks(userId: string) {
  const [questionBookmarks, grammarBookmarks, savedWords] = await Promise.all([
    db.bookmark.findMany({
      where: { userId, type: "QUESTION" },
      orderBy: { createdAt: "desc" },
      include: { question: { select: { id: true, part: true, prompt: true, testId: true } } },
    }),
    db.bookmark.findMany({
      where: { userId, type: "GRAMMAR" },
      orderBy: { createdAt: "desc" },
      include: { grammarLesson: { select: { slug: true, title: true, topic: { select: { slug: true } } } } },
    }),
    db.savedWord.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  return { questionBookmarks, grammarBookmarks, savedWords };
}

/** Study/game items for the Saved Words list. A `SavedWord` gets its
 * meaning/IPA/audio from one of two places: the learner's own custom
 * `meaningVi` (added via the "add your own word" Quizlet-style flow, takes
 * precedence since it's what they explicitly typed), or — for words saved
 * from a dictionary lookup instead — a join against the dictionary cache.
 * A word with neither is skipped (nothing to quiz on yet) rather than
 * showing a blank card. */
export async function getSavedWordStudyItems(userId: string): Promise<StudyItem[]> {
  const saved = await db.savedWord.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  if (saved.length === 0) return [];

  const entries = await db.dictionaryEntry.findMany({ where: { word: { in: saved.map((s) => s.word) } } });
  const entryByWord = new Map(entries.map((e) => [e.word, e]));

  const items: StudyItem[] = [];
  for (const s of saved) {
    if (s.meaningVi) {
      items.push({
        id: s.id,
        term: s.word,
        ipa: null,
        partOfSpeech: null,
        meaningVi: s.meaningVi,
        exampleEn: s.exampleEn,
        audioUrl: null,
      });
      continue;
    }

    const entry = entryByWord.get(s.word);
    if (!entry?.meaningVi) continue;
    items.push({
      id: s.id,
      term: entry.word,
      ipa: entry.ipa,
      partOfSpeech: entry.partOfSpeech,
      meaningVi: entry.meaningVi,
      exampleEn: null,
      audioUrl: entry.audioUrlUs ?? entry.audioUrlUk,
    });
  }
  return items;
}

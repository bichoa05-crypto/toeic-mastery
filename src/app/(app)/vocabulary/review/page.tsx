import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDueReviewQueue } from "@/lib/data/vocabulary";
import { ReviewSession } from "@/components/vocabulary/review-session";

export const metadata: Metadata = { title: "Ôn tập từ vựng" };

export default async function VocabularyReviewPage() {
  const profile = await requireUser();
  const due = await getDueReviewQueue(profile.id);

  const items = due.map((d) => ({
    userVocabularyId: d.id,
    word: {
      word: d.vocabularyWord.word,
      ipa: d.vocabularyWord.ipa,
      partOfSpeech: d.vocabularyWord.partOfSpeech,
      meaningVi: d.vocabularyWord.meaningVi,
      definitionEn: d.vocabularyWord.definitionEn,
      exampleEn: d.vocabularyWord.exampleEn,
      exampleVi: d.vocabularyWord.exampleVi,
      collocations: d.vocabularyWord.collocations,
      audioUrlUs: d.vocabularyWord.audioUrlUs,
      audioUrlUk: d.vocabularyWord.audioUrlUk,
    },
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ôn tập từ vựng</h1>
        <p className="mt-1 text-sm text-muted-foreground">Flashcard theo lịch lặp lại ngắt quãng (spaced repetition).</p>
      </div>
      <ReviewSession items={items} />
    </div>
  );
}

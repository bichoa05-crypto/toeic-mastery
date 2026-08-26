import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { DictionaryService, DictionaryLookupError } from "@/lib/services/dictionary-service";
import { logDictionaryHistoryAction } from "@/lib/actions/dictionary";
import { isWordSaved } from "@/lib/data/dictionary-history";
import { WordDetailView } from "@/components/dictionary/word-detail-view";
import type { DictionaryResult } from "@/lib/types/dictionary";

export async function generateMetadata({ params }: { params: Promise<{ word: string }> }): Promise<Metadata> {
  const { word } = await params;
  return { title: decodeURIComponent(word) };
}

export default async function DictionaryWordPage({ params }: { params: Promise<{ word: string }> }) {
  const { word } = await params;
  const profile = await requireUser();
  const decoded = decodeURIComponent(word);

  const savedRow = await isWordSaved(profile.id, decoded);

  const service = new DictionaryService();
  let result: DictionaryResult | null;
  try {
    result = await service.lookup(decoded);
  } catch (err) {
    // Upstream dictionary API is down — if the learner already gave this
    // word their own custom definition, show that instead of a hard error.
    if (err instanceof DictionaryLookupError && savedRow?.meaningVi) {
      result = null;
    } else {
      throw err;
    }
  }

  if (!result) {
    // Not in the dictionary provider (or it's temporarily unreachable) — a
    // learner-authored custom word (added via "add your own word", not a
    // provider lookup) still has its own meaning to show.
    if (savedRow?.meaningVi) {
      result = {
        word: savedRow.word,
        ipa: null,
        partOfSpeech: null,
        meaningVi: savedRow.meaningVi,
        audioUrlUs: null,
        audioUrlUk: null,
        definitions: [],
        synonyms: [],
        antonyms: [],
        examples: savedRow.exampleEn ? [{ en: savedRow.exampleEn }] : [],
        wordFamily: [],
        collocations: [],
        source: "cache",
      };
    } else {
      notFound();
    }
  } else {
    await logDictionaryHistoryAction(decoded, "SEARCH");
  }

  return (
    <WordDetailView
      result={result}
      initialSaved={!!savedRow}
      initialFavorite={savedRow?.isFavorite ?? false}
      initialNote={savedRow?.note ?? ""}
    />
  );
}

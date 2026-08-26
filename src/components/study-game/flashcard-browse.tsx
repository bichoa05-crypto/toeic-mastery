"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { StudyItem } from "@/lib/services/study-game";
import type { ReviewRating } from "@/lib/services/spaced-repetition";

/** Free browse-through flashcards — flip to see the meaning, no grading.
 * The lightweight "học" half of "học mà chơi": zero pressure, just exposure.
 * Flipping a card (actually looking at the meaning, not just skipping past
 * it) still counts as a light "GOOD" review — passive exposure is still
 * study, just gentler than getting quizzed on it. */
export function FlashcardBrowse({
  items,
  onFinish,
  onItemResult,
}: {
  items: StudyItem[];
  onFinish: () => void;
  onItemResult?: (itemId: string, rating: ReviewRating) => void;
}) {
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const item = items[index];
  const isLast = index === items.length - 1;

  function goNext() {
    if (flipped) onItemResult?.(item.id, "GOOD");
    if (isLast) {
      onFinish();
      return;
    }
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  function goPrev() {
    if (index === 0) return;
    setFlipped(false);
    setIndex((i) => i - 1);
  }

  function playAudio() {
    if (!item.audioUrl) return;
    new Audio(item.audioUrl).play().catch(() => {});
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-full max-w-sm">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>
            {index + 1} / {items.length}
          </span>
          <span>{flipped ? "Nghĩa" : "Từ vựng"}</span>
        </div>
        <Progress value={((index + 1) / items.length) * 100} className="h-1.5" />
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex h-64 w-full max-w-sm flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 text-center shadow-soft transition-transform hover:-translate-y-0.5"
      >
        {!flipped ? (
          <>
            <p className="text-3xl font-bold tracking-tight">{item.term}</p>
            {item.ipa && <p className="text-sm text-muted-foreground">/{item.ipa}/</p>}
            {item.partOfSpeech && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{item.partOfSpeech}</span>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Bấm để xem nghĩa</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-primary">{item.meaningVi}</p>
            {item.exampleEn && <p className="mt-1 max-w-xs text-sm italic text-muted-foreground">&ldquo;{item.exampleEn}&rdquo;</p>}
          </>
        )}
      </button>

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon" onClick={goPrev} disabled={index === 0} aria-label="Từ trước">
          <ChevronLeft className="size-4" />
        </Button>
        {item.audioUrl && (
          <Button type="button" variant="outline" size="icon" onClick={playAudio} aria-label="Phát âm">
            <Volume2 className="size-4" />
          </Button>
        )}
        <Button type="button" onClick={goNext} className={cn(isLast && "bg-success hover:bg-success/90")}>
          {isLast ? "Hoàn thành" : "Từ tiếp theo"}
          {!isLast && <ChevronRight className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

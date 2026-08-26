"use client";

import * as React from "react";
import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FlashCard, type FlashCardWord } from "@/components/vocabulary/flash-card";
import { reviewVocabularyAction, logStudySessionAction } from "@/lib/actions/vocabulary";
import type { ReviewRating } from "@/lib/services/spaced-repetition";

interface ReviewItem {
  userVocabularyId: string;
  word: FlashCardWord;
}

export function ReviewSession({ items }: { items: ReviewItem[] }) {
  const [queue] = React.useState(items);
  const [index, setIndex] = React.useState(0);
  const [, startTransition] = React.useTransition();
  const startedAtRef = React.useRef<number | null>(null);

  const current = queue[index];
  const isDone = !current;
  const progressPercent = queue.length > 0 ? Math.round((index / queue.length) * 100) : 0;

  // Logs real elapsed time once the queue is exhausted — same "count it
  // toward Tổng giờ học" treatment the flashcard/quiz/matching games get, so
  // this older graded-review flow isn't the one place study time still goes
  // untracked. Guarded by clearing the ref, so a Strict Mode double-invoke
  // (or any re-render while isDone stays true) can't log twice.
  React.useEffect(() => {
    if (!isDone || startedAtRef.current === null) return;
    const elapsedSec = Math.round((Date.now() - startedAtRef.current) / 1000);
    startedAtRef.current = null;
    void logStudySessionAction(elapsedSec);
  }, [isDone]);

  function handleRate(rating: ReviewRating) {
    if (!current) return;
    startedAtRef.current ??= Date.now();
    startTransition(async () => {
      const result = await reviewVocabularyAction(current.userVocabularyId, rating);
      if (result.error) toast.error(result.error);
    });
    setIndex((i) => i + 1);
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
        <PartyPopper className="size-10 text-primary" />
        <h2 className="text-lg font-semibold">Bạn đã ôn xong {queue.length} từ hôm nay!</h2>
        <p className="text-sm text-muted-foreground">Quay lại vào ngày mai để tiếp tục duy trì streak học tập.</p>
        <div className="mt-2 flex gap-2">
          <Button asChild variant="outline">
            <Link href="/vocabulary/topics">Học thêm từ mới</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Về Tổng quan</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-md">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>
            {index + 1}/{queue.length}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      <FlashCard key={current.userVocabularyId} word={current.word} onRate={handleRate} />
    </div>
  );
}

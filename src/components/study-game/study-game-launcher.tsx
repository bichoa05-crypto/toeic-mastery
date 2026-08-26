"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Grid3x3, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canPlayQuiz, type StudyItem } from "@/lib/services/study-game";
import { logStudySessionAction, practiceVocabularyWordAction } from "@/lib/actions/vocabulary";
import type { ReviewRating } from "@/lib/services/spaced-repetition";
import { FlashcardBrowse } from "@/components/study-game/flashcard-browse";
import { QuizMode } from "@/components/study-game/quiz-mode";
import { MatchingGame } from "@/components/study-game/matching-game";
import { cn } from "@/lib/utils";

type Mode = "flashcard" | "quiz" | "match";

const MIN_ITEMS_FOR_MATCH = 3;

/** Shared entry point for both the Vocabulary topic games and the Saved
 * Words games — same three modes, same session-time logging, different
 * item source feeding it.
 *
 * `trackable` should only be true when `items` are real `VocabularyWord`s
 * (topic study, where `item.id` is a `vocabularyWordId`) — Saved Words have
 * no SRS row to update, so their sessions log time but not word progress. */
export function StudyGameLauncher({
  items,
  title,
  backHref,
  backLabel,
  trackable = false,
}: {
  items: StudyItem[];
  title: string;
  backHref: string;
  backLabel: string;
  trackable?: boolean;
}) {
  const [mode, setMode] = React.useState<Mode | null>(null);
  const startedAtRef = React.useRef<number | null>(null);

  function start(next: Mode) {
    startedAtRef.current = Date.now();
    setMode(next);
  }

  function finishSession() {
    if (startedAtRef.current !== null) {
      const elapsedSec = Math.round((Date.now() - startedAtRef.current) / 1000);
      void logStudySessionAction(elapsedSec);
      startedAtRef.current = null;
    }
    setMode(null);
  }

  // So "Từ vựng đã học" (and the XP derived from it) actually moves when
  // playing a game, not just when using the dedicated graded review — every
  // right/wrong signal a game produces feeds the same SRS progress.
  const handleItemResult = trackable
    ? (itemId: string, rating: ReviewRating) => {
        void practiceVocabularyWordAction(itemId, rating);
      }
    : undefined;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
        <p className="text-sm font-semibold">Chưa có từ nào để luyện tập</p>
        <p className="max-w-sm text-sm text-muted-foreground">Hãy thêm từ vào đây trước khi bắt đầu chế độ học/chơi.</p>
        <Button asChild size="sm" className="mt-1">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
    );
  }

  if (mode) {
    return (
      <div className="flex flex-col gap-5">
        <button type="button" onClick={finishSession} className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Chọn chế độ khác
        </button>
        {mode === "flashcard" && <FlashcardBrowse items={items} onFinish={finishSession} onItemResult={handleItemResult} />}
        {mode === "quiz" && <QuizMode items={items} onFinish={finishSession} onItemResult={handleItemResult} />}
        {mode === "match" && <MatchingGame items={items} onFinish={finishSession} onItemResult={handleItemResult} />}
      </div>
    );
  }

  const quizReady = canPlayQuiz(items);
  const matchReady = items.length >= MIN_ITEMS_FOR_MATCH;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={backHref} className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {backLabel}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{items.length} từ · chọn cách bạn muốn luyện tập</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ModeCard
          icon={BookOpenCheck}
          label="Học thẻ ghi nhớ"
          description="Lật thẻ xem nghĩa, tự nhịp độ của bạn"
          onClick={() => start("flashcard")}
        />
        <ModeCard
          icon={ListChecks}
          label="Trắc nghiệm"
          description={quizReady ? "Chọn nghĩa đúng, ghi điểm" : `Cần ít nhất 4 từ`}
          onClick={() => start("quiz")}
          disabled={!quizReady}
        />
        <ModeCard
          icon={Grid3x3}
          label="Nối từ"
          description={matchReady ? "Ghép từ với nghĩa nhanh nhất" : "Cần ít nhất 3 từ"}
          onClick={() => start("match")}
          disabled={!matchReady}
        />
      </div>
    </div>
  );
}

function ModeCard({
  icon: Icon,
  label,
  description,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-start gap-2.5 rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition-all",
        disabled ? "cursor-not-allowed opacity-50" : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

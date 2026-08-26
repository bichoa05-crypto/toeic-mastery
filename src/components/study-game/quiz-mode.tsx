"use client";

import * as React from "react";
import { Check, X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConfettiBurst } from "@/components/shared/confetti-burst";
import { cn } from "@/lib/utils";
import { buildQuiz, type StudyItem } from "@/lib/services/study-game";
import type { ReviewRating } from "@/lib/services/spaced-repetition";

/** Multiple-choice quiz: term shown, four meanings, pick the right one.
 * Immediate right/wrong feedback, score tally, confetti on a strong finish —
 * the "chơi mà học" half, testing recall instead of just re-reading. */
export function QuizMode({
  items,
  onFinish,
  onItemResult,
}: {
  items: StudyItem[];
  onFinish: (result?: { correct: number; total: number }) => void;
  onItemResult?: (itemId: string, rating: ReviewRating) => void;
}) {
  const [questions] = React.useState(() => buildQuiz(items));
  const [index, setIndex] = React.useState(0);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [score, setScore] = React.useState(0);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const done = index >= questions.length;

  function pick(optionIndex: number) {
    if (picked !== null) return;
    setPicked(optionIndex);
    const correct = optionIndex === question.correctIndex;
    if (correct) setScore((s) => s + 1);
    onItemResult?.(question.item.id, correct ? "GOOD" : "AGAIN");
  }

  function next() {
    if (isLast) {
      setIndex((i) => i + 1);
      return;
    }
    setPicked(null);
    setIndex((i) => i + 1);
  }

  if (done) {
    const percent = Math.round((score / questions.length) * 100);
    const strong = percent >= 80;
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        {strong && <ConfettiBurst />}
        <span className="flex size-16 items-center justify-center rounded-full bg-warning/10 text-warning">
          <Trophy className="size-8" />
        </span>
        <div>
          <p className="text-2xl font-bold">
            {score}/{questions.length} câu đúng
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{percent}% chính xác</p>
        </div>
        <Button type="button" onClick={() => onFinish({ correct: score, total: questions.length })}>
          Xong
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-full max-w-sm">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>
            Câu {index + 1} / {questions.length}
          </span>
          <span>Điểm: {score}</span>
        </div>
        <Progress value={(index / questions.length) * 100} className="h-1.5" />
      </div>

      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
        <p className="text-xs font-medium text-muted-foreground">Từ này có nghĩa là gì?</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">{question.item.term}</p>
        {question.item.ipa && <p className="mt-1 text-sm text-muted-foreground">/{question.item.ipa}/</p>}
      </div>

      <div className="grid w-full max-w-sm grid-cols-1 gap-2.5">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctIndex;
          const isPicked = i === picked;
          const revealed = picked !== null;
          return (
            <button
              key={option}
              type="button"
              onClick={() => pick(i)}
              disabled={revealed}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                !revealed && "border-border bg-card hover:border-primary/40 hover:bg-accent/40",
                revealed && isCorrect && "border-success bg-success/10 text-success",
                revealed && isPicked && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                revealed && !isCorrect && !isPicked && "border-border opacity-50"
              )}
            >
              {option}
              {revealed && isCorrect && <Check className="size-4 shrink-0" />}
              {revealed && isPicked && !isCorrect && <X className="size-4 shrink-0" />}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <Button type="button" onClick={next}>
          {isLast ? "Xem kết quả" : "Câu tiếp theo"}
        </Button>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { ClipboardList } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { getTestList, type TestListFilters } from "@/lib/data/tests";
import { PracticeFilters } from "@/components/practice/practice-filters";
import { TestCard } from "@/components/practice/test-card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "Luyện đề" };

const VALID_CATEGORIES = new Set(["ALL", "FULL", "LISTENING", "READING", "PART1", "PART2", "PART3", "PART4", "PART5", "PART6", "PART7"]);

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireUser();
  const params = await searchParams;

  const rawCategory = typeof params.category === "string" ? params.category : "ALL";
  const filters: TestListFilters = {
    category: VALID_CATEGORIES.has(rawCategory) ? (rawCategory as TestListFilters["category"]) : "ALL",
    difficulty: (typeof params.difficulty === "string" ? params.difficulty : undefined) as TestListFilters["difficulty"],
    completion: (typeof params.completion === "string" ? params.completion : "ALL") as TestListFilters["completion"],
    sort: (typeof params.sort === "string" ? params.sort : "NEWEST") as TestListFilters["sort"],
  };

  const tests = await getTestList(profile.id, filters);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Luyện đề</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chọn đề thi phù hợp với mục tiêu của bạn.</p>
      </div>

      <Suspense>
        <PracticeFilters />
      </Suspense>

      {tests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Không tìm thấy đề thi phù hợp" description="Hãy thử thay đổi bộ lọc." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <TestCard
              key={test.id}
              title={test.title}
              difficulty={test.difficulty}
              totalQuestions={test.totalQuestions}
              durationMinutes={test.durationMinutes}
              usersCompleted={test.usersCompleted}
              bestScore={test.bestScore}
              progressPercent={test.progressPercent}
              href={test.resumeAttemptId ? `/exam/${test.resumeAttemptId}` : `/practice/${test.id}`}
              ctaLabel={test.resumeAttemptId ? "Tiếp tục" : test.isCompleted ? "Làm lại" : "Bắt đầu"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

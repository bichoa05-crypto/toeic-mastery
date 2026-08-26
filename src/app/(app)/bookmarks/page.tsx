import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Gamepad2, Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getBookmarks } from "@/lib/data/bookmarks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { AddCustomWordsDialog } from "@/components/vocabulary/add-custom-words-dialog";
import { PART_META } from "@/lib/constants/toeic";

export const metadata: Metadata = { title: "Đã lưu" };

export default async function BookmarksPage() {
  const profile = await requireUser();
  const { questionBookmarks, grammarBookmarks, savedWords } = await getBookmarks(profile.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Đã lưu</h1>
        <p className="mt-1 text-sm text-muted-foreground">Câu hỏi, từ vựng và bài học ngữ pháp bạn đã đánh dấu.</p>
      </div>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Câu hỏi ({questionBookmarks.length})</TabsTrigger>
          <TabsTrigger value="vocabulary">Từ vựng ({savedWords.length})</TabsTrigger>
          <TabsTrigger value="grammar">Ngữ pháp ({grammarBookmarks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-4">
          {questionBookmarks.length === 0 ? (
            <EmptyState icon={Bookmark} title="Chưa lưu câu hỏi nào" actionLabel="Luyện đề" actionHref="/practice" />
          ) : (
            <div className="flex flex-col gap-2">
              {questionBookmarks.map(
                (b) =>
                  b.question && (
                    <Link
                      key={b.id}
                      href={b.question.testId ? `/history/${b.question.testId}` : "/bookmarks"}
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm hover:border-primary/40"
                    >
                      <span className="truncate">{b.question.prompt || `Câu hỏi ${PART_META[b.question.part].shortLabel}`}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{PART_META[b.question.part].shortLabel}</span>
                    </Link>
                  )
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vocabulary" className="mt-4">
          {savedWords.length === 0 ? (
            <div className="flex flex-col items-center gap-3">
              <EmptyState icon={Star} title="Chưa lưu từ vựng nào" actionLabel="Mở từ điển" actionHref="/dictionary" />
              <AddCustomWordsDialog />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <Link href="/bookmarks/study">
                    <Gamepad2 className="size-4" /> Học & Chơi với từ đã lưu
                  </Link>
                </Button>
                <AddCustomWordsDialog />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {savedWords.map((w) => (
                  <Link
                    key={w.id}
                    href={`/dictionary/${encodeURIComponent(w.word)}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm hover:border-primary/40"
                  >
                    {w.word}
                    {w.isFavorite && <Star className="size-3.5 fill-current text-warning" />}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="grammar" className="mt-4">
          {grammarBookmarks.length === 0 ? (
            <EmptyState icon={Bookmark} title="Chưa lưu bài học ngữ pháp nào" actionLabel="Xem ngữ pháp" actionHref="/grammar" />
          ) : (
            <div className="flex flex-col gap-2">
              {grammarBookmarks.map(
                (b) =>
                  b.grammarLesson && (
                    <Link
                      key={b.id}
                      href={`/grammar/${b.grammarLesson.topic.slug}`}
                      className="rounded-xl border border-border bg-card px-4 py-3 text-sm hover:border-primary/40"
                    >
                      {b.grammarLesson.title}
                    </Link>
                  )
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WordListEditor, type WordRow } from "@/components/vocabulary/word-list-editor";
import { bulkAddCustomWordsAction } from "@/lib/actions/dictionary";

/** Quizlet-style "add your own word" for the learner's Saved Words list —
 * doesn't require the dictionary API to already know the term, so proper
 * nouns, TOEIC jargon, or phrases work fine too. */
export function AddCustomWordsDialog() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  async function handleSubmit(rows: WordRow[]) {
    const result = await bulkAddCustomWordsAction(rows);
    if (result.error) return { error: result.error };
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Thêm từ mới
      </Button>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm từ của riêng bạn</DialogTitle>
          <DialogDescription>Tự định nghĩa từ mới — kể cả từ điển chưa có (tên riêng, thuật ngữ TOEIC, cụm từ...).</DialogDescription>
        </DialogHeader>
        <WordListEditor onSubmit={handleSubmit} submitLabel="Lưu vào Đã lưu" termLabel="Từ" definitionLabel="Nghĩa của bạn" />
      </DialogContent>
    </Dialog>
  );
}

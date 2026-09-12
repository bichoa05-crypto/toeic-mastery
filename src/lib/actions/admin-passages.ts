"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { questionGroupFormSchema, type QuestionGroupFormInput } from "@/lib/validations/admin";
import { getOrCreatePracticePool, syncIfPracticePool } from "@/lib/services/practice-pool";

export interface GroupActionResult {
  error?: string;
  passageId?: string;
}

function splitList(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Creates one Passage plus its N shared-stimulus Questions together — the
 * two rows are only ever meaningful as a pair (a Question referencing a
 * half-created Passage, or a Passage with no Questions, are both broken
 * states), so this needs real atomicity, unlike importQuestionsAction's
 * bulk-import path (which deliberately runs outside a transaction since
 * each of *its* rows is independent — see that action's own comment). An
 * array-style `db.$transaction([...])` can't work here either way: each
 * Question's `data.passageId` depends on the Passage's freshly-generated
 * id, which doesn't exist until the Passage create has actually run — this
 * requires the interactive `db.$transaction(async (tx) => ...)` form.
 */
export async function createQuestionGroupAction(input: QuestionGroupFormInput): Promise<GroupActionResult> {
  await requireAdmin();
  const parsed = questionGroupFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  const data = parsed.data;

  let testId = data.testId || null;
  let testSectionId: string | null = null;
  if (!testId && data.status === "PUBLISHED") {
    const pool = await getOrCreatePracticePool(data.part);
    testId = pool.testId;
    testSectionId = pool.testSectionId;
  }

  // Appends after whatever's already in the test so a freshly-authored
  // group never jumps ahead of question 1 — createQuestionAction doesn't
  // bother with this for a single question, but a whole visible group
  // landing at position 0 would be a much more noticeable defect.
  const baseOrder = testId
    ? ((await db.question.aggregate({ where: { testId }, _max: { orderIndex: true } }))._max.orderIndex ?? 0) + 1
    : 0;

  await db.$transaction(
    async (tx) => {
      const passage = await tx.passage.create({
        data: {
          testId,
          part: data.part,
          format: data.format,
          layout: data.layout,
          title: data.title || null,
          texts: data.texts,
          audioUrl: data.audioUrl || null,
          imageUrl: data.imageUrl || null,
          transcript: data.transcript || null,
          orderIndex: baseOrder,
        },
      });

      await Promise.all(
        data.questions.map((q, i) =>
          tx.question.create({
            data: {
              testId,
              testSectionId,
              passageId: passage.id,
              part: data.part,
              orderIndex: baseOrder + i,
              prompt: q.prompt,
              correctLabel: q.correctLabel,
              explanationVi: q.explanationVi,
              grammarTopicSlug: q.grammarTopicSlug || null,
              vocabularyFocus: splitList(q.vocabularyFocus),
              evidenceText: q.evidenceText || null,
              difficulty: data.difficulty,
              status: data.status,
              options: {
                create: q.options.map((o) => ({
                  label: o.label,
                  content: o.content,
                  isCorrect: o.label === q.correctLabel,
                  distractorExplanation: o.distractorExplanation || null,
                })),
              },
            },
          })
        )
      );

      return passage.id;
    },
    { timeout: 10_000 }
  );

  await syncIfPracticePool(testId, data.part);

  revalidatePath("/admin/questions");
  redirect(`/admin/questions?part=${data.part}`);
}

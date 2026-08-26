"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function startAttemptAction(testId: string, mode: "PRACTICE" | "EXAM" = "EXAM") {
  const profile = await requireUser();

  const existing = await db.attempt.findFirst({
    where: { userId: profile.id, testId, status: "IN_PROGRESS" },
  });
  if (existing) redirect(`/exam/${existing.id}`);

  const test = await db.test.findUniqueOrThrow({ where: { id: testId } });

  const attempt = await db.attempt.create({
    data: {
      userId: profile.id,
      testId,
      mode,
      allowedDurationSec: test.durationMinutes * 60,
      remainingSec: test.durationMinutes * 60,
    },
  });

  await db.studySession.create({
    data: {
      userId: profile.id,
      activityType: mode === "EXAM" ? "EXAM" : "PRACTICE",
      attemptId: attempt.id,
      metadata: { testId },
    },
  });

  redirect(`/exam/${attempt.id}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export interface ActionResult {
  error?: string;
}

export async function setUserRoleAction(userId: string, role: "STUDENT" | "ADMIN"): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (admin.id === userId && role !== "ADMIN") {
    return { error: "Bạn không thể tự gỡ quyền admin của chính mình" };
  }

  await db.profile.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  return {};
}

export async function resolveReportAction(reportId: string): Promise<ActionResult> {
  await requireAdmin();
  await db.questionReport.update({ where: { id: reportId }, data: { status: "RESOLVED", resolvedAt: new Date() } });
  revalidatePath("/admin/analytics");
  return {};
}

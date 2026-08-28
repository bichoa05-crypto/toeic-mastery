"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { grantProDays } from "@/lib/services/pro-grant";

export interface ActionResult {
  error?: string;
  code?: string;
}

export async function generateActivationCodeAction(planDurationDays: number): Promise<ActionResult> {
  await requireAdmin();
  if (!Number.isInteger(planDurationDays) || planDurationDays <= 0) {
    return { error: "Số ngày không hợp lệ" };
  }

  const code = `PRO-${randomUUID().slice(0, 8).toUpperCase()}`;
  await db.activationCode.create({ data: { code, planDurationDays } });

  revalidatePath("/admin/payments");
  return { code };
}

export async function approvePaymentAction(paymentId: string): Promise<ActionResult> {
  await requireAdmin();

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { error: "Không tìm thấy giao dịch" };
  if (payment.status !== "PENDING") return { error: "Giao dịch này đã được xử lý" };

  await db.payment.update({ where: { id: paymentId }, data: { status: "SUCCESS", paidAt: new Date() } });
  await grantProDays(payment.userId, payment.planDurationDays);

  revalidatePath("/admin/payments");
  return {};
}

export async function rejectPaymentAction(paymentId: string): Promise<ActionResult> {
  await requireAdmin();

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { error: "Không tìm thấy giao dịch" };
  if (payment.status !== "PENDING") return { error: "Giao dịch này đã được xử lý" };

  await db.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } });

  revalidatePath("/admin/payments");
  return {};
}

import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import type { Profile } from "@/generated/prisma/client";

/**
 * Cached per-request: Supabase auth + the matching Profile row. `cache()`
 * dedupes this across every server component that calls it in one render.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // The `handle_new_user` Supabase trigger creates the Profile row on signup
  // (see supabase/sql/002_profile_trigger.sql). This lazily backfills it for
  // any account created before the trigger existed, without writing on the
  // common (already-exists) path.
  const existing = await db.profile.findUnique({ where: { id: user.id } });
  if (existing) return existing;

  return db.profile.create({
    data: {
      id: user.id,
      email: user.email ?? "",
      fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
      avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    },
  });
});

export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (profile.role !== "ADMIN") redirect("/dashboard");
  return profile;
}

/** The one account allowed to change a user's Học viên/Admin role — every
 * other admin can still see the admin section (requireAdmin still governs
 * page access) but the role control itself is view-only for them. Plain
 * email check by design: this is a single hardcoded owner account, not a
 * general permissions system. */
export const SUPER_ADMIN_EMAIL = "bichoa05@gmail.com";

export function isSuperAdmin(profile: Pick<Profile, "email">): boolean {
  return profile.email === SUPER_ADMIN_EMAIL;
}

/** True while the user's plan is PRO and (if set) hasn't lapsed yet — a
 * null `proExpiresAt` means a lifetime/admin-granted Pro with no expiry. */
export function isPro(profile: Pick<Profile, "plan" | "proExpiresAt">): boolean {
  return profile.plan === "PRO" && (!profile.proExpiresAt || profile.proExpiresAt > new Date());
}

export async function requirePro(): Promise<Profile> {
  const profile = await requireUser();
  if (!isPro(profile)) redirect("/pricing?upgrade=required");
  return profile;
}

/** For Route Handlers: no redirect, callers return a 401 JSON response. */
export async function getAuthedProfileOrNull(): Promise<Profile | null> {
  return getCurrentProfile();
}

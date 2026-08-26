import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { ProfileForm } from "@/components/profile/profile-form";
import { StatCard } from "@/components/shared/stat-card";
import { Target, Trophy } from "lucide-react";

export const metadata: Metadata = { title: "Hồ sơ" };

export default async function ProfilePage() {
  const profile = await requireUser();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quản lý thông tin và mục tiêu học tập của bạn.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <AvatarUploader userId={profile.id} initialUrl={profile.avatarUrl} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Trophy} label="Điểm hiện tại" value={profile.currentScore ?? "—"} />
        <StatCard icon={Target} label="Điểm mục tiêu" value={profile.targetScore ?? "—"} accent="info" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Email</span>
          <span className="text-sm">{profile.email}</span>
        </div>
        <ProfileForm
          defaultValues={{
            fullName: profile.fullName ?? "",
            targetScore: profile.targetScore ?? 700,
            examDate: profile.examDate ? profile.examDate.toISOString().slice(0, 10) : null,
            dailyStudyTargetMinutes: profile.dailyStudyTargetMinutes,
          }}
        />
      </div>
    </div>
  );
}

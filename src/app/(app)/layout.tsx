import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser();

  return (
    <AppShell
      profile={{
        fullName: profile.fullName,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        streakCount: profile.streakCount,
        targetScore: profile.targetScore,
        currentScore: profile.currentScore,
      }}
    >
      {children}
    </AppShell>
  );
}

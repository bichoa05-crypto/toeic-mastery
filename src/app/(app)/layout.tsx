import { requireUser } from "@/lib/auth";
import { getVocabularyReminder } from "@/lib/data/vocabulary";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser();
  const vocabularyReminder = await getVocabularyReminder(profile.id);

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
        plan: profile.plan,
        proExpiresAt: profile.proExpiresAt,
      }}
      vocabularyReminder={vocabularyReminder}
    >
      {children}
    </AppShell>
  );
}

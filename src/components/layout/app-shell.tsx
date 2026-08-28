"use client";

import * as React from "react";
import { AppSidebar, type SidebarProfile } from "@/components/layout/app-sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import type { VocabularyReminder } from "@/lib/data/vocabulary";

export function AppShell({
  profile,
  vocabularyReminder,
  children,
}: {
  profile: SidebarProfile;
  vocabularyReminder: VocabularyReminder;
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <div className="min-h-svh bg-background">
      <AppSidebar profile={profile} />
      <div className="flex min-h-svh flex-col lg:pl-64">
        <TopHeader profile={profile} vocabularyReminder={vocabularyReminder} onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-8">{children}</main>
      </div>
      <MobileBottomNav />
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

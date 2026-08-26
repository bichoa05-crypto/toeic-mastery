import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getSavedWordStudyItems } from "@/lib/data/bookmarks";
import { StudyGameLauncher } from "@/components/study-game/study-game-launcher";

export const metadata: Metadata = { title: "Học & Chơi — Từ đã lưu" };

export default async function SavedWordsStudyPage() {
  const profile = await requireUser();
  const items = await getSavedWordStudyItems(profile.id);

  return <StudyGameLauncher items={items} title="Từ đã lưu" backHref="/bookmarks" backLabel="Quay lại Đã lưu" />;
}

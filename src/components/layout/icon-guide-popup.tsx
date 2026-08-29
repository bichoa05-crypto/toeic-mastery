"use client";

import * as React from "react";
import { Bell, Moon, Music, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SITE_THEMES } from "@/lib/constants/site-themes";

const SEEN_KEY = "icon_guide_seen_v1";
const PREVIEW_THEMES = SITE_THEMES.filter((t) => t.media !== "gradient").slice(0, 3);

function IconRow({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5 text-left">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="text-sm">{label}</span>
    </div>
  );
}

/**
 * One-time onboarding popup introducing the header icon cluster (Lo-fi
 * music, Live theme, Dark mode, reminder bell) — shown once ever per
 * browser to new users, regardless of plan tier (this is a feature guide,
 * not a sales pitch; contrast with WelcomeOfferModal's repeated,
 * X-only-dismiss discount offer). Dismissible normally (X, outside click,
 * Escape all work) since there's nothing time-sensitive to protect here.
 */
export function IconGuidePopup() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    let alreadySeen = true;
    try {
      alreadySeen = localStorage.getItem(SEEN_KEY) === "true";
    } catch {
      // localStorage unavailable — fail closed (don't show), same spirit as
      // other popups' fail-open-but-harmless localStorage try/catch.
    }
    if (!alreadySeen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "true");
    } catch {
      // Fail open — worst case it shows once more next visit.
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-xl font-bold">Không gian học theo phong cách riêng ✨</DialogTitle>
        <p className="-mt-2 text-sm text-muted-foreground">Vài icon nhỏ ở góc trên bên phải giúp buổi học của bạn thoải mái hơn:</p>

        <div className="flex flex-col gap-2">
          <IconRow icon={Music} label="Nhạc Lo-fi/Chill để tăng độ tập trung" />
          <IconRow icon={Palette} label="Live theme — đổi hình nền động cho cả trang web" />
          <IconRow icon={Moon} label="Dark Mode bảo vệ mắt khi học buổi tối" />
          <IconRow icon={Bell} label="Nhắc lịch ôn tập để không đứt chuỗi Streak" />
        </div>

        {PREVIEW_THEMES.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 overflow-hidden rounded-xl">
            {PREVIEW_THEMES.map((theme) => (
              <div
                key={theme.id}
                className="h-16 bg-cover bg-center"
                style={{
                  backgroundImage: theme.previewSrc
                    ? `url(${theme.previewSrc}), linear-gradient(135deg, ${theme.swatchFrom}, ${theme.swatchTo})`
                    : `linear-gradient(135deg, ${theme.swatchFrom}, ${theme.swatchTo})`,
                }}
              />
            ))}
          </div>
        )}

        <Button type="button" size="lg" className="w-full text-base font-semibold" onClick={dismiss}>
          Đã hiểu, khám phá ngay
        </Button>
      </DialogContent>
    </Dialog>
  );
}

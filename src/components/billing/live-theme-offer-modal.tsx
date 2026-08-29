"use client";

import * as React from "react";
import Link from "next/link";
import { Palette, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SITE_THEMES } from "@/lib/constants/site-themes";

const VIEW_COUNT_KEY = "live_theme_offer_view_count_v1";
const MAX_VIEWS = 5;

const PREVIEW_THEMES = SITE_THEMES.filter((t) => t.tier === "PRO").slice(0, 3);

/** Evergreen Pro upsell for the Live theme feature — shown up to MAX_VIEWS
 * times, once per site visit (mount of AppShell), only to Free-tier users
 * and only when the (more valuable, time-limited) WelcomeOfferModal isn't
 * already claiming the screen — see app-shell.tsx. Same "closing doesn't
 * reset the counter, X is the only way out" contract as that modal. */
export function LiveThemeOfferModal() {
  const [open, setOpen] = React.useState(false);
  const [viewNumber, setViewNumber] = React.useState<number | null>(null);

  React.useEffect(() => {
    let count = MAX_VIEWS + 1;
    try {
      count = Number(localStorage.getItem(VIEW_COUNT_KEY) ?? "0") + 1;
      localStorage.setItem(VIEW_COUNT_KEY, String(count));
    } catch {
      count = 1;
    }
    if (count <= MAX_VIEWS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewNumber(count);
      setOpen(true);
    }
  }, []);

  function dismiss() {
    setOpen(false);
  }

  const isLastView = viewNumber === MAX_VIEWS;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-md gap-0 overflow-hidden border-0 p-0 shadow-2xl"
      >
        <div className="relative grid grid-cols-3 gap-1 p-1">
          {PREVIEW_THEMES.map((theme) => (
            <div
              key={theme.id}
              className="h-28 bg-cover bg-center"
              style={{
                backgroundImage: theme.previewSrc
                  ? `url(${theme.previewSrc}), linear-gradient(135deg, ${theme.swatchFrom}, ${theme.swatchTo})`
                  : `linear-gradient(135deg, ${theme.swatchFrom}, ${theme.swatchTo})`,
              }}
            />
          ))}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Đóng"
            className="absolute right-3 top-3 z-10 rounded-full bg-black/30 p-1.5 text-white transition-colors hover:bg-black/50"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" /> LIVE THEME
          </span>

          <DialogTitle className="text-xl font-bold leading-snug">Đổi cả giao diện web theo phong cách bạn thích</DialogTitle>

          <p className="text-sm text-muted-foreground">
            Nâng cấp Pro để mở khóa toàn bộ Live theme — nền ảnh & video chuyển động áp dụng cho mọi trang, không chỉ riêng Dashboard.
          </p>

          <Button asChild size="lg" className="glow-pulse-primary w-full text-base font-semibold" onClick={dismiss}>
            <Link href="/pricing">
              <Palette className="size-4" /> Khám phá Live theme Pro
            </Link>
          </Button>

          {isLastView && <p className="text-xs text-muted-foreground">Đây là lần cuối gợi ý này xuất hiện.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

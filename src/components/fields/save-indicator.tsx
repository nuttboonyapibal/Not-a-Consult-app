"use client";

import { useT } from "@/lib/i18n/client";
import { cn } from "../ui";
import type { SaveState } from "./use-autosave";

export function SaveIndicator({ state, className }: { state: SaveState; className?: string }) {
  const { t } = useT();
  if (state === "idle") return null;
  const label =
    state === "error" ? t("common.saveFailed") : state === "saved" ? t("common.saved") : t("common.saving");
  return (
    <span className={cn("text-xs", state === "error" ? "text-err" : "text-muted", className)} aria-live="polite">
      {state === "saved" ? "✓ " : ""}
      {label}
    </span>
  );
}

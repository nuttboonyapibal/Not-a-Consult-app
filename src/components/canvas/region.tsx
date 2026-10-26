"use client";

import { useT } from "@/lib/i18n/client";
import { cn } from "../ui";
import type { EditApi } from "./edit-api";

const levelDot = { warn: "bg-warn", error: "bg-err" } as const;

/**
 * One field on a canvas. Read-only it is just a labelled block; with an
 * EditApi it can be selected, and shows its suggested order and issues.
 */
export function Region({
  fieldKey,
  label,
  edit,
  children,
  className,
  hideLabel,
}: {
  fieldKey: string;
  label: string;
  edit?: EditApi;
  children: React.ReactNode;
  className?: string;
  hideLabel?: boolean;
}) {
  const { t } = useT();
  if (!edit) {
    return (
      <div className={className}>
        {!hideLabel && <div className="mb-1.5 text-xs font-semibold text-muted">{label}</div>}
        {children}
      </div>
    );
  }
  const selected = edit.selected === fieldKey;
  const level = edit.levelOf(fieldKey);
  const next = !selected && edit.isNext(fieldKey);
  return (
    <div
      id={`f-${fieldKey}`}
      role="group"
      aria-label={label}
      data-selected={selected || undefined}
      onClick={() => edit.onSelect(fieldKey)}
      onFocusCapture={() => edit.selected !== fieldKey && edit.onSelect(fieldKey)}
      className={cn(
        "-m-1 scroll-mt-28 rounded-lg p-1 transition-colors",
        selected ? "bg-accent-soft/40 ring-2 ring-accent" : "cursor-pointer hover:bg-black/[0.025]",
        next && "outline-2 outline-offset-1 outline-accent/40 outline-dashed",
        className,
      )}
    >
      <div className={cn("mb-1.5 flex items-center gap-1.5", hideLabel && "sr-only")}>
        <span
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
            selected ? "bg-accent text-white" : "bg-black/[0.06] text-muted",
          )}
          title={t("canvas.order")}
        >
          {edit.orderOf(fieldKey)}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted">{label}</span>
        {edit.hasSuggestion(fieldKey) && (
          <span className="text-xs text-accent" title={t("ws.suggestion")}>
            ✦
          </span>
        )}
        {level && level !== "ok" && <span className={cn("size-1.5 shrink-0 rounded-full", levelDot[level])} title={t("ws.checks")} />}
      </div>
      {children}
    </div>
  );
}

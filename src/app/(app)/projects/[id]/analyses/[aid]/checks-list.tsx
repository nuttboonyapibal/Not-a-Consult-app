"use client";

import type { Check, CheckLevel } from "@/frameworks/types";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/components/ui";

export const levelOrder: Record<CheckLevel, number> = { ok: 0, warn: 1, error: 2 };

const icon: Record<CheckLevel, string> = { ok: "✓", warn: "!", error: "✕" };
const tone: Record<CheckLevel, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  error: "bg-err-soft text-err",
};

export function ChecksList({ checks, onSelect }: { checks: Check[]; onSelect?: (field: string) => void }) {
  const { t, tx } = useT();
  const sorted = [...checks].sort((a, b) => levelOrder[b.level] - levelOrder[a.level]);
  const clean = !sorted.some((c) => c.level !== "ok");
  return (
    <ul className="space-y-1.5">
      {clean && <li className="p-1 text-sm text-ok">✓ {t("ws.allGood")}</li>}
      {sorted.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            disabled={!c.field || !onSelect}
            onClick={() => c.field && onSelect?.(c.field)}
            className="flex w-full items-start gap-2 rounded-md p-1 text-left text-sm leading-snug enabled:hover:bg-paper"
          >
            <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", tone[c.level])}>
              {icon[c.level]}
            </span>
            <span>{tx(c.message)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

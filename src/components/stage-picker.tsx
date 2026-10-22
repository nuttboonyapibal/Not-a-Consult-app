"use client";

import { useState } from "react";
import { STAGES } from "@/frameworks/catalog";
import type { Stage } from "@/frameworks/types";
import { useT } from "@/lib/i18n/client";
import { cn } from "./ui";

export function StagePicker({ name, defaultValue }: { name: string; defaultValue: Stage }) {
  const { tx } = useT();
  const [value, setValue] = useState<Stage>(defaultValue);
  return (
    <div className="space-y-2" role="radiogroup">
      {STAGES.map((s) => (
        <label
          key={s.key}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
            value === s.key ? "border-accent bg-accent-soft/60" : "border-line hover:bg-paper",
          )}
        >
          <input
            type="radio"
            name={name}
            value={s.key}
            checked={value === s.key}
            onChange={() => setValue(s.key)}
            className="mt-1 size-4 accent-accent"
          />
          <span>
            <span className="block text-sm font-medium">{tx(s.name)}</span>
            <span className="block text-xs text-muted">{tx(s.question)}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

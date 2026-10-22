"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { Input } from "../ui";

export function ListInput({
  id,
  value,
  onChange,
  readOnly,
}: {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  readOnly?: boolean;
}) {
  const { t } = useT();
  const [draft, setDraft] = useState("");

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onChange([...value, text]);
    setDraft("");
  };

  return (
    <div className="space-y-1.5">
      {value.map((item, i) => (
        <div key={i} className="group flex items-center gap-2">
          <span className="w-4 shrink-0 text-center text-xs text-faint">•</span>
          <Input
            value={item}
            readOnly={readOnly}
            aria-label={`${i + 1}`}
            onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))}
            onBlur={(e) => {
              if (!e.target.value.trim()) onChange(value.filter((_, j) => j !== i));
            }}
            className="h-9"
          />
          {!readOnly && (
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="rounded px-1.5 text-faint opacity-60 hover:text-err group-hover:opacity-100"
              aria-label={t("common.remove")}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <div className="flex items-center gap-2">
          <span className="w-4 shrink-0 text-center text-xs text-faint">+</span>
          <Input
            id={id}
            value={draft}
            placeholder={value.length ? t("ws.addItem") : t("ws.enterToAdd")}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                add();
              }
            }}
            onBlur={add}
            className="h-9 border-dashed"
          />
        </div>
      )}
    </div>
  );
}

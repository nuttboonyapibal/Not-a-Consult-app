"use client";

import { useState } from "react";
import { newItem, toItems } from "@/frameworks/helpers";
import type { ListItem } from "@/frameworks/types";
import { useT } from "@/lib/i18n/client";
import { TAG_STYLES } from "../canvas/edit-api";
import { cn, Input } from "../ui";

/** List editor for forms. Keeps each item's id and color when its text changes. */
export function ListInput({
  id,
  value,
  onChange,
  readOnly,
}: {
  id: string;
  value: unknown;
  onChange: (value: ListItem[]) => void;
  readOnly?: boolean;
}) {
  const { t } = useT();
  const items = toItems(value, id);
  const [draft, setDraft] = useState("");

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, newItem(text)]);
    setDraft("");
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={item.id} className="group flex items-center gap-2">
          <span className={cn("size-1.5 shrink-0 rounded-full", item.tag ? TAG_STYLES[item.tag].dot : "bg-faint")} />
          <Input
            value={item.text}
            readOnly={readOnly}
            aria-label={`${i + 1}`}
            onChange={(e) => onChange(items.map((x) => (x.id === item.id ? { ...x, text: e.target.value } : x)))}
            onBlur={(e) => {
              if (!e.target.value.trim()) onChange(items.filter((x) => x.id !== item.id));
            }}
            className="h-9"
          />
          {!readOnly && (
            <button
              type="button"
              onClick={() => onChange(items.filter((x) => x.id !== item.id))}
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
          <span className="w-1.5 shrink-0 text-center text-xs text-faint">+</span>
          <Input
            id={id}
            value={draft}
            placeholder={items.length ? t("ws.addItem") : t("ws.enterToAdd")}
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

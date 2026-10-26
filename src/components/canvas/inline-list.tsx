"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { newItem, toItems } from "@/frameworks/helpers";
import { TAG_COLORS, type Lang, type ListItem, type TagColor } from "@/frameworks/types";
import { useT } from "@/lib/i18n/client";
import { cn } from "../ui";
import { TAG_STYLES, type EditApi } from "./edit-api";

function autosize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/** Read-only list with link colors. */
export function ReadList({ value, activeTag, empty }: { value: unknown; activeTag?: TagColor | null; empty: string }) {
  const items = toItems(value).filter((i) => i.text.trim());
  if (items.length === 0) return <p className="text-sm text-faint italic">{empty}</p>;
  return (
    <ul className="space-y-1 text-[13px] leading-snug">
      {items.map((item) => (
        <li key={item.id} className={cn("flex gap-1.5", activeTag && item.tag !== activeTag && "opacity-30")}>
          <span className={cn("mt-[0.45em] size-1.5 shrink-0 rounded-full", item.tag ? TAG_STYLES[item.tag].dot : "bg-faint")} />
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Sticky-note style list edited in place. Enter adds the next item, Backspace on
 * an empty item removes it, and items can be dragged to other list cells.
 */
export function InlineList({ fieldKey, value, edit, label }: { fieldKey: string; value: unknown; edit: EditApi; label: string }) {
  const { t, lang } = useT();
  const items = toItems(value, fieldKey);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const inputs = useRef(new Map<string, HTMLTextAreaElement>());
  const rows = useRef(new Map<string, HTMLLIElement>());
  const pendingFocus = useRef<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    for (const el of inputs.current.values()) autosize(el);
    if (pendingFocus.current) {
      inputs.current.get(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    }
  });

  useEffect(() => {
    if (!menuId) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuId]);

  const save = (next: ListItem[]) => edit.onChange(fieldKey, next);

  const insertAt = (index: number) => {
    const item = newItem("");
    pendingFocus.current = item.id;
    save([...items.slice(0, index), item, ...items.slice(index)]);
  };

  const remove = (id: string, focusPrevious = false) => {
    const index = items.findIndex((i) => i.id === id);
    if (focusPrevious && index > 0) pendingFocus.current = items[index - 1].id;
    save(items.filter((i) => i.id !== id));
  };

  const dragging = edit.drag !== null;
  const drop = (e: React.DragEvent) => {
    e.preventDefault();
    if (edit.drag && dropIndex !== null) edit.moveItem(edit.drag, { field: fieldKey, index: dropIndex });
    setDropIndex(null);
    edit.setDrag(null);
  };

  return (
    <div
      onDragOver={(e) => {
        if (!dragging) return;
        e.preventDefault();
        if (e.target === e.currentTarget) setDropIndex(items.length);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropIndex(null);
      }}
      onDrop={drop}
      className={cn("min-h-8 rounded-md", dragging && "bg-accent-soft/30 outline-1 outline-accent/30 outline-dashed")}
    >
      <ul className="space-y-1">
        {items.map((item, index) => {
          const dim = edit.activeTag && item.tag !== edit.activeTag;
          return (
            <li
              key={item.id}
              ref={(el) => {
                if (el) rows.current.set(item.id, el);
                else rows.current.delete(item.id);
              }}
              onDragOver={(e) => {
                if (!dragging) return;
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setDropIndex(index + (e.clientY > rect.top + rect.height / 2 ? 1 : 0));
              }}
              className={cn(
                "group relative flex items-start gap-1 rounded-md border border-line border-l-[3px] bg-card py-0.5 pr-1 shadow-[0_1px_0_rgba(0,0,0,0.03)]",
                item.tag ? TAG_STYLES[item.tag].note : "border-l-line",
                dim && "opacity-30",
                edit.drag?.id === item.id && "opacity-40",
              )}
            >
              {dropIndex === index && <span className="absolute -top-[3px] right-0 left-0 h-0.5 rounded bg-accent" />}
              {dropIndex === index + 1 && index === items.length - 1 && (
                <span className="absolute right-0 -bottom-[3px] left-0 h-0.5 rounded bg-accent" />
              )}
              <span
                draggable
                title={t("canvas.dragHint")}
                aria-hidden
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", item.text);
                  const row = rows.current.get(item.id);
                  if (row) e.dataTransfer.setDragImage(row, 12, 12);
                  edit.setDrag({ field: fieldKey, id: item.id });
                }}
                onDragEnd={() => {
                  edit.setDrag(null);
                  setDropIndex(null);
                }}
                className="mt-1.5 cursor-grab px-0.5 text-[10px] leading-none text-faint opacity-0 select-none group-hover:opacity-100 active:cursor-grabbing"
              >
                ⋮⋮
              </span>
              <textarea
                ref={(el) => {
                  if (el) inputs.current.set(item.id, el);
                  else inputs.current.delete(item.id);
                }}
                rows={1}
                value={item.text}
                aria-label={`${label} ${index + 1}`}
                onChange={(e) => {
                  autosize(e.target);
                  save(items.map((i) => (i.id === item.id ? { ...i, text: e.target.value.replace(/\n/g, " ") } : i)));
                }}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === "Enter") {
                    e.preventDefault();
                    insertAt(index + 1);
                  } else if (e.key === "Backspace" && item.text === "") {
                    e.preventDefault();
                    remove(item.id, true);
                  }
                }}
                onBlur={(e) => {
                  if (!e.target.value.trim() && !menuRef.current?.contains(e.relatedTarget as Node)) remove(item.id);
                }}
                className="block min-w-0 flex-1 resize-none overflow-hidden bg-transparent px-1 py-1 text-[13px] leading-snug outline-none"
              />
              <button
                type="button"
                aria-label={t("canvas.itemMenu")}
                aria-expanded={menuId === item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuId(menuId === item.id ? null : item.id);
                }}
                className="mt-0.5 rounded px-1 text-xs text-faint opacity-0 group-hover:opacity-100 hover:bg-black/5 hover:text-ink focus:opacity-100"
              >
                ⋯
              </button>
              {menuId === item.id && (
                <ItemMenu
                  ref={menuRef}
                  lang={lang}
                  tag={item.tag}
                  targets={edit.listTargets.filter((x) => x.key !== fieldKey)}
                  onTag={(tag) => {
                    save(items.map((i) => (i.id === item.id ? { id: i.id, text: i.text, ...(tag ? { tag } : {}) } : i)));
                    setMenuId(null);
                  }}
                  onMove={(target) => {
                    edit.moveItem({ field: fieldKey, id: item.id }, { field: target, index: Number.MAX_SAFE_INTEGER });
                    setMenuId(null);
                  }}
                  onDelete={() => {
                    remove(item.id);
                    setMenuId(null);
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          edit.onSelect(fieldKey);
          insertAt(items.length);
        }}
        className="mt-1 rounded px-1.5 py-0.5 text-xs text-accent hover:bg-accent-soft"
      >
        + {t("canvas.add")}
      </button>
    </div>
  );
}

function ItemMenu({
  ref,
  lang,
  tag,
  targets,
  onTag,
  onMove,
  onDelete,
}: {
  ref: React.Ref<HTMLDivElement>;
  lang: Lang;
  tag?: TagColor;
  targets: { key: string; label: string }[];
  onTag: (tag: TagColor | null) => void;
  onMove: (target: string) => void;
  onDelete: () => void;
}) {
  const { t } = useT();
  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full right-0 z-30 mt-1 w-56 rounded-lg border border-line bg-card p-2 text-left shadow-lg"
    >
      <div className="mb-1 text-[11px] font-semibold text-muted">{t("canvas.tag")}</div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {TAG_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={TAG_STYLES[c].label[lang]}
            aria-pressed={tag === c}
            onClick={() => onTag(c)}
            className={cn("size-5 rounded-full ring-offset-1", TAG_STYLES[c].dot, tag === c && "ring-2 ring-ink")}
          />
        ))}
        <button type="button" onClick={() => onTag(null)} className="rounded-full border border-line px-2 text-[11px] text-muted hover:text-ink">
          {t("canvas.noTag")}
        </button>
      </div>
      {targets.length > 0 && (
        <>
          <div className="mb-1 text-[11px] font-semibold text-muted">{t("canvas.moveTo")}</div>
          <div className="mb-2 max-h-40 overflow-y-auto">
            {targets.map((target) => (
              <button
                key={target.key}
                type="button"
                onClick={() => onMove(target.key)}
                className="block w-full truncate rounded px-2 py-1 text-left text-xs hover:bg-paper"
              >
                → {target.label}
              </button>
            ))}
          </div>
        </>
      )}
      <button type="button" onClick={onDelete} className="w-full rounded px-2 py-1 text-left text-xs text-err hover:bg-err-soft">
        {t("common.delete")}
      </button>
    </div>
  );
}

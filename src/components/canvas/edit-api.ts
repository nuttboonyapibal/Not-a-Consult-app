import type { CheckLevel, Data, TagColor } from "@/frameworks/types";

export interface DragItem {
  field: string;
  id: string;
}

/**
 * What a framework view needs to become editable. Views render read-only when
 * they get no EditApi (report, library, examples).
 */
export interface EditApi {
  onChange(key: string, value: unknown): void;
  /** Saves several keys at once, e.g. when an item moves between cells. */
  onPatch(patch: Data): void;
  selected: string | null;
  onSelect(key: string | null): void;
  levelOf(key: string): CheckLevel | undefined;
  /** 1-based position in the suggested filling order. */
  orderOf(key: string): number;
  /** True for the next empty field in the suggested order. */
  isNext(key: string): boolean;
  hasSuggestion(key: string): boolean;
  /** When set, items without this color are dimmed. */
  activeTag: TagColor | null;
  onTagFilter(tag: TagColor | null): void;
  /** List fields an item can be moved to. */
  listTargets: { key: string; label: string }[];
  drag: DragItem | null;
  setDrag(item: DragItem | null): void;
  moveItem(from: DragItem, to: { field: string; index: number }): void;
}

export const TAG_STYLES: Record<TagColor, { dot: string; note: string; label: { th: string; en: string } }> = {
  blue: { dot: "bg-sky-500", note: "border-l-sky-500 bg-sky-50", label: { th: "ฟ้า", en: "Blue" } },
  green: { dot: "bg-emerald-500", note: "border-l-emerald-500 bg-emerald-50", label: { th: "เขียว", en: "Green" } },
  amber: { dot: "bg-amber-500", note: "border-l-amber-500 bg-amber-50", label: { th: "ส้ม", en: "Amber" } },
  rose: { dot: "bg-rose-500", note: "border-l-rose-500 bg-rose-50", label: { th: "ชมพู", en: "Rose" } },
  violet: { dot: "bg-violet-500", note: "border-l-violet-500 bg-violet-50", label: { th: "ม่วง", en: "Violet" } },
  teal: { dot: "bg-teal-500", note: "border-l-teal-500 bg-teal-50", label: { th: "เขียวหัวเป็ด", en: "Teal" } },
};

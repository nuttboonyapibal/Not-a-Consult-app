"use client";

import { listItems } from "@/frameworks/helpers";
import { TAG_COLORS, type Data, type FrameworkDef, type Lang, type TagColor } from "@/frameworks/types";
import { UI } from "@/lib/i18n/ui";
import { cn } from "../ui";
import { TAG_STYLES, type EditApi } from "./edit-api";

/** Colors in use, named after the anchor field's items (e.g. customer segments). */
export function tagLabels(def: FrameworkDef, data: Data): Map<TagColor, string> {
  const anchor = def.canvas?.linkAnchor;
  const labels = new Map<TagColor, string>();
  const fields = def.steps.flatMap((s) => s.fields).filter((f) => f.type === "list");
  const ordered = anchor ? [...fields.filter((f) => f.key === anchor), ...fields.filter((f) => f.key !== anchor)] : fields;
  for (const f of ordered) {
    for (const item of listItems(data, f.key)) {
      if (item.tag && item.text.trim() && !labels.has(item.tag)) labels.set(item.tag, item.text.trim());
    }
  }
  return labels;
}

export function TagLegend({ def, data, lang, edit }: { def: FrameworkDef; data: Data; lang: Lang; edit?: EditApi }) {
  const labels = tagLabels(def, data);
  if (labels.size === 0 && !edit) return null;
  const used = TAG_COLORS.filter((c) => labels.has(c));
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="font-semibold text-muted">{UI["canvas.legend"][lang]}</span>
      {used.length === 0 && <span className="text-faint">{UI["canvas.legendHint"][lang]}</span>}
      {used.map((c) => {
        const active = edit?.activeTag === c;
        const content = (
          <>
            <span className={cn("size-2.5 rounded-full", TAG_STYLES[c].dot)} />
            <span className="max-w-40 truncate">{labels.get(c)}</span>
          </>
        );
        return edit ? (
          <button
            key={c}
            type="button"
            aria-pressed={active}
            onClick={() => edit.onTagFilter(active ? null : c)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 transition-colors",
              active ? "border-ink bg-ink text-white" : "border-line bg-card hover:border-ink/40",
            )}
          >
            {content}
          </button>
        ) : (
          <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-0.5">
            {content}
          </span>
        );
      })}
      {edit?.activeTag && (
        <button type="button" onClick={() => edit.onTagFilter(null)} className="text-accent hover:underline">
          {UI["canvas.showAll"][lang]}
        </button>
      )}
    </div>
  );
}

"use client";

import { CONCLUSION, list, NEXT, SOURCES, str } from "@/frameworks/helpers";
import { getFramework } from "@/frameworks/registry";
import type { Data, Lang, ViewKey } from "@/frameworks/types";
import type { EditApi } from "../canvas/edit-api";
import { CanvasView } from "./canvas-view";
import { CascadeView } from "./cascade-view";
import { FunnelView } from "./funnel-view";
import { GenericView } from "./generic-view";
import { OkrView } from "./okr-view";
import { Slot, type ViewProps } from "./shared";
import { StatementView } from "./statement-view";
import { TreeView } from "./tree-view";
import { UnitEconomicsView } from "./unit-economics-view";

const CLOSING = {
  sources: { th: "ข้อมูลที่ใช้", en: "Data used" },
  conclusion: { th: "ข้อสรุป", en: "Conclusion" },
  next: { th: "ขั้นต่อไป", en: "Next step" },
};

const VIEWS: Record<ViewKey, (props: ViewProps) => React.ReactNode> = {
  statement: StatementView,
  canvas: CanvasView,
  calculator: UnitEconomicsView,
  cascade: CascadeView,
  funnel: FunnelView,
  okr: OkrView,
  tree: TreeView,
  generic: GenericView,
};

/** Views that can be edited in place on the canvas. */
export const EDITABLE_VIEWS = new Set<ViewKey>(["statement", "canvas", "calculator", "cascade", "funnel", "okr", "tree"]);

/**
 * The picture of a framework. Read-only in the report and library; editable in
 * place in the workspace when `edit` is given.
 */
export function FrameworkView({ frameworkKey, data, lang, edit }: { frameworkKey: string; data: Data; lang: Lang; edit?: EditApi }) {
  const def = getFramework(frameworkKey);
  if (!def) return null;
  const props: ViewProps = { def, data, lang, edit };
  const View = VIEWS[def.view];

  if (edit) {
    return (
      <div className="space-y-5">
        <View {...props} />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-ink/15 bg-card p-3 md:col-span-2">
            <Slot view={props} field={CONCLUSION} />
          </div>
          <div className="rounded-xl border border-accent/25 bg-accent-soft/40 p-3">
            <Slot view={props} field={NEXT} />
          </div>
          <div className="rounded-xl border border-line bg-card p-3">
            <Slot view={props} field={SOURCES} />
          </div>
        </div>
      </div>
    );
  }

  const conclusion = str(data, CONCLUSION);
  const next = str(data, NEXT);
  const sources = list(data, SOURCES);
  return (
    <div className="space-y-5">
      <View {...props} />
      {(conclusion || next || sources.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {conclusion && (
            <div className="rounded-xl border border-ink/10 bg-ink p-4 text-white md:col-span-2">
              <div className="mb-1 text-xs font-medium tracking-wide text-white/60 uppercase">{CLOSING.conclusion[lang]}</div>
              <p className="text-base leading-relaxed font-medium">{conclusion}</p>
            </div>
          )}
          {next && (
            <div className="rounded-xl border border-accent/25 bg-accent-soft/60 p-4">
              <div className="mb-1 text-xs font-medium text-accent">{CLOSING.next[lang]}</div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{next}</p>
            </div>
          )}
          {sources.length > 0 && (
            <div className="rounded-xl border border-line bg-card p-4">
              <div className="mb-1.5 text-xs font-medium text-muted">{CLOSING.sources[lang]}</div>
              <ul className="space-y-0.5 text-sm">
                {sources.map((s) => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

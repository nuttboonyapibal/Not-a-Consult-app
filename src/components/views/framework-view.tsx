"use client";

import { CONCLUSION, list, NEXT, SOURCES, str } from "@/frameworks/helpers";
import { getFramework } from "@/frameworks/registry";
import type { Data, Lang } from "@/frameworks/types";
import { CanvasView } from "./canvas-view";
import { CascadeView } from "./cascade-view";
import { FunnelView } from "./funnel-view";
import { GenericView } from "./generic-view";
import { OkrView } from "./okr-view";
import { StatementView } from "./statement-view";
import { TreeView } from "./tree-view";
import { UnitEconomicsView } from "./unit-economics-view";

const CLOSING = {
  sources: { th: "ข้อมูลที่ใช้", en: "Data used" },
  conclusion: { th: "ข้อสรุป", en: "Conclusion" },
  next: { th: "ขั้นต่อไป", en: "Next step" },
};

/** Read-only picture of a framework. Used in the workspace, the report and the library. */
export function FrameworkView({ frameworkKey, data, lang }: { frameworkKey: string; data: Data; lang: Lang }) {
  const def = getFramework(frameworkKey);
  if (!def) return null;
  const props = { def, data, lang };
  let body: React.ReactNode;
  switch (def.view) {
    case "statement":
      body = <StatementView {...props} />;
      break;
    case "canvas":
      body = <CanvasView {...props} />;
      break;
    case "calculator":
      body = <UnitEconomicsView {...props} />;
      break;
    case "cascade":
      body = <CascadeView {...props} />;
      break;
    case "funnel":
      body = <FunnelView {...props} />;
      break;
    case "okr":
      body = <OkrView {...props} />;
      break;
    case "tree":
      body = <TreeView {...props} />;
      break;
    default:
      body = <GenericView {...props} />;
  }

  const conclusion = str(data, CONCLUSION);
  const next = str(data, NEXT);
  const sources = list(data, SOURCES);
  return (
    <div className="space-y-5">
      {body}
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

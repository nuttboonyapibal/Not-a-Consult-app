"use client";

import { Slot, type ViewProps } from "./shared";

const WORDS = {
  play: { th: "เล่น", en: "Play" },
  notPlay: { th: "ไม่เล่น", en: "Don't play" },
};

const BODY: Record<string, string[]> = {
  aspiration: ["aspiration"],
  how: ["howToWin"],
  capabilities: ["capabilities"],
  systems: ["systems"],
};

export function CascadeView(view: ViewProps) {
  const { def, lang } = view;
  return (
    <ol className="space-y-2">
      {def.steps.map((step, i) => (
        <li key={step.id}>
          <div className="rounded-xl border border-line bg-card p-4" style={{ marginLeft: `${Math.min(i, 4) * 12}px` }}>
            <div className="mb-2 text-sm font-semibold">{step.title[lang]}</div>
            {step.id === "where" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-ok-soft/70 p-3">
                  <div className="mb-1 text-xs font-semibold text-ok">{WORDS.play[lang]}</div>
                  <Slot view={view} field="whereToPlay" hideLabel />
                </div>
                <div className="rounded-lg bg-err-soft/60 p-3">
                  <div className="mb-1 text-xs font-semibold text-err">{WORDS.notPlay[lang]}</div>
                  <Slot view={view} field="whereNotToPlay" hideLabel />
                </div>
              </div>
            ) : (
              (BODY[step.id] ?? []).map((key) => <Slot key={key} view={view} field={key} hideLabel />)
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

"use client";

import { AARRR_STAGES, computeFunnel } from "@/frameworks/defs/aarrr";
import { num, str } from "@/frameworks/helpers";
import { formatMetric } from "@/lib/format";
import { InlineNumber, InlineText } from "../canvas/inline-inputs";
import { Region } from "../canvas/region";
import { cn } from "../ui";
import { fieldLabel, Slot, type ViewProps } from "./shared";

const WORDS = {
  leak: { th: "รั่วมากที่สุด", en: "Biggest leak" },
  ofPrev: { th: "ไปต่อ", en: "continue" },
};

export function FunnelView(view: ViewProps) {
  const { def, data, lang, edit } = view;
  const { steps, leak } = computeFunnel(data);
  const top = steps[0].count ?? Math.max(0, ...steps.map((s) => s.count ?? 0));
  const period = str(data, "period");
  return (
    <div className="space-y-4">
      {edit ? (
        <Slot view={view} field="period" className="max-w-xs" />
      ) : (
        period && <div className="text-sm text-muted">{period}</div>
      )}
      <div className="space-y-2">
        {steps.map((s, i) => {
          const stage = AARRR_STAGES[i];
          const width = top > 0 && s.count != null ? Math.max(4, (s.count / top) * 100) : 4;
          const isLeak = s.key === leak;
          const defKey = `${s.key}Def`;
          const countKey = `${s.key}Count`;
          return (
            <div
              key={s.key}
              className={cn(
                "grid items-center gap-3 text-sm",
                edit ? "grid-cols-1 sm:grid-cols-[200px_1fr_150px]" : "grid-cols-[130px_1fr_110px]",
              )}
            >
              <div>
                <div className="font-medium">{stage.name[lang]}</div>
                {edit ? (
                  <Region fieldKey={defKey} label={fieldLabel(def, defKey, lang)} edit={edit} hideLabel>
                    <InlineText
                      singleLine
                      value={str(data, defKey)}
                      onChange={(v) => edit.onChange(defKey, v)}
                      placeholder={stage.question[lang]}
                      label={fieldLabel(def, defKey, lang)}
                      className="text-xs text-muted"
                    />
                  </Region>
                ) : (
                  <div className="truncate text-xs text-muted">{str(data, defKey) || stage.question[lang]}</div>
                )}
              </div>
              <div className="h-9 rounded-md bg-paper">
                <div
                  className={cn("flex h-full items-center rounded-md px-2 text-xs font-semibold text-white tabular-nums", isLeak ? "bg-err" : "bg-accent")}
                  style={{ width: `${width}%` }}
                >
                  {!edit && s.count != null ? formatMetric(s.count, "number", lang) : ""}
                </div>
              </div>
              <div className={cn("text-xs tabular-nums", edit ? "sm:text-right" : "text-right", isLeak ? "font-semibold text-err" : "text-muted")}>
                {edit && (
                  <Region fieldKey={countKey} label={fieldLabel(def, countKey, lang)} edit={edit} hideLabel>
                    <InlineNumber value={num(data, countKey)} onChange={(v) => edit.onChange(countKey, v)} label={fieldLabel(def, countKey, lang)} />
                  </Region>
                )}
                {s.conversion != null ? `${formatMetric(s.conversion * 100, "percent", lang)} ${WORDS.ofPrev[lang]}` : ""}
                {isLeak && <div>{WORDS.leak[lang]}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {(edit || str(data, "leakCause") || str(data, "fixPlan")) && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-card p-4">
            <Slot view={view} field="leakCause" />
          </div>
          <div className="rounded-xl border border-line bg-card p-4">
            <Slot view={view} field="fixPlan" />
          </div>
        </div>
      )}
    </div>
  );
}

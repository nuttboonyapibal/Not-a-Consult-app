"use client";

import { krProgress } from "@/frameworks/defs/okrs";
import { cellNum, cellStr, rows, str } from "@/frameworks/helpers";
import { formatMetric } from "@/lib/format";
import { InlineText } from "../canvas/inline-inputs";
import { Region } from "../canvas/region";
import { EMPTY, fieldLabel, Slot, type ViewProps } from "./shared";

const WORDS = {
  review: { th: "ทบทวน", en: "Review" },
};

export function OkrView(view: ViewProps) {
  const { def, data, lang, edit } = view;
  const krs = rows(data, "keyResults").filter((r) => cellStr(r, "text"));
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-ink p-6 text-white">
        {edit ? (
          <div className="space-y-2">
            <Region fieldKey="period" label={fieldLabel(def, "period", lang)} edit={edit} hideLabel>
              <InlineText
                singleLine
                value={str(data, "period")}
                onChange={(v) => edit.onChange("period", v)}
                placeholder={`Objective · ${fieldLabel(def, "period", lang)}`}
                label={fieldLabel(def, "period", lang)}
                className="text-xs tracking-wide text-white/60 uppercase placeholder:text-white/40 focus:bg-white/10"
              />
            </Region>
            <Region fieldKey="objective" label="Objective" edit={edit} hideLabel>
              <InlineText
                value={str(data, "objective")}
                onChange={(v) => edit.onChange("objective", v)}
                placeholder="Objective…"
                label="Objective"
                className="text-xl font-medium text-white placeholder:text-white/40 focus:bg-white/10"
              />
            </Region>
          </div>
        ) : (
          <>
            <div className="mb-1 text-xs tracking-wide text-white/55 uppercase">Objective {str(data, "period") && `· ${str(data, "period")}`}</div>
            <p className="text-xl leading-relaxed font-medium">{str(data, "objective") || <span className="text-white/40 italic">{EMPTY[lang]}</span>}</p>
          </>
        )}
      </div>
      {edit && (
        <div className="rounded-xl border border-line bg-card p-3">
          <Slot view={view} field="keyResults" />
        </div>
      )}
      <div className="space-y-2">
        {krs.map((r) => {
          const p = krProgress(r);
          const pct = p == null ? null : Math.max(0, Math.min(1, p));
          return (
            <div key={r.id} className="rounded-xl border border-line bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="font-medium">{cellStr(r, "text")}</div>
                {cellStr(r, "owner") && <div className="text-xs text-muted">{cellStr(r, "owner")}</div>}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(pct ?? 0) * 100}%` }} />
                </div>
                <div className="w-44 text-right text-xs text-muted tabular-nums">
                  {formatMetric(cellNum(r, "baseline"), "number", lang)} → <b className="text-ink">{formatMetric(cellNum(r, "current"), "number", lang)}</b> →{" "}
                  {formatMetric(cellNum(r, "target"), "number", lang)}
                </div>
              </div>
            </div>
          );
        })}
        {!edit && krs.length === 0 && <p className="text-sm text-faint italic">{EMPTY[lang]}</p>}
      </div>
      {edit ? (
        <Slot view={view} field="reviewRhythm" className="max-w-md" />
      ) : (
        str(data, "reviewRhythm") && (
          <p className="text-sm text-muted">
            {WORDS.review[lang]}: {str(data, "reviewRhythm")}
          </p>
        )
      )}
    </div>
  );
}

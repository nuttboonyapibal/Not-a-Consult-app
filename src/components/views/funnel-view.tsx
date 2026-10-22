import { AARRR_STAGES, computeFunnel } from "@/frameworks/defs/aarrr";
import { str } from "@/frameworks/helpers";
import { formatMetric } from "@/lib/format";
import { cn } from "../ui";
import type { ViewProps } from "./shared";

const WORDS = {
  leak: { th: "รั่วมากที่สุด", en: "Biggest leak" },
  cause: { th: "ทำไมรั่ว", en: "Why it leaks" },
  fix: { th: "สิ่งที่จะแก้", en: "The fix" },
  ofPrev: { th: "ไปต่อ", en: "continue" },
};

export function FunnelView({ data, lang }: ViewProps) {
  const { steps, leak } = computeFunnel(data);
  const top = steps[0].count ?? Math.max(0, ...steps.map((s) => s.count ?? 0));
  const period = str(data, "period");
  return (
    <div className="space-y-4">
      {period && <div className="text-sm text-muted">{period}</div>}
      <div className="space-y-2">
        {steps.map((s, i) => {
          const stage = AARRR_STAGES[i];
          const width = top > 0 && s.count != null ? Math.max(4, (s.count / top) * 100) : 4;
          const isLeak = s.key === leak;
          return (
            <div key={s.key} className="grid grid-cols-[130px_1fr_110px] items-center gap-3 text-sm">
              <div>
                <div className="font-medium">{stage.name[lang]}</div>
                <div className="truncate text-xs text-muted">{str(data, `${s.key}Def`) || stage.question[lang]}</div>
              </div>
              <div className="h-9 rounded-md bg-paper">
                <div
                  className={cn("flex h-full items-center rounded-md px-2 text-xs font-semibold text-white tabular-nums", isLeak ? "bg-err" : "bg-accent")}
                  style={{ width: `${width}%` }}
                >
                  {s.count != null ? formatMetric(s.count, "number", lang) : ""}
                </div>
              </div>
              <div className={cn("text-right text-xs tabular-nums", isLeak ? "font-semibold text-err" : "text-muted")}>
                {s.conversion != null ? `${formatMetric(s.conversion * 100, "percent", lang)} ${WORDS.ofPrev[lang]}` : ""}
                {isLeak && <div>{WORDS.leak[lang]}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {(str(data, "leakCause") || str(data, "fixPlan")) && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-card p-4">
            <div className="mb-1 text-xs font-semibold text-muted">{WORDS.cause[lang]}</div>
            <p className="text-sm leading-relaxed whitespace-pre-line">{str(data, "leakCause") || "—"}</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-4">
            <div className="mb-1 text-xs font-semibold text-muted">{WORDS.fix[lang]}</div>
            <p className="text-sm leading-relaxed whitespace-pre-line">{str(data, "fixPlan") || "—"}</p>
          </div>
        </div>
      )}
    </div>
  );
}

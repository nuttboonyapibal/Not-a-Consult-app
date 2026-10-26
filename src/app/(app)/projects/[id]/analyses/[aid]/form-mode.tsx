"use client";

import { stepCompletion, stepsOf } from "@/frameworks/registry";
import type { Check, CheckLevel, Data, FrameworkDef } from "@/frameworks/types";
import { FieldInput } from "@/components/fields/field-input";
import { Button, Card, cn } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { FieldShortcuts } from "./side-cards";
import { SuggestionCard } from "./suggestion-card";

/** The step-by-step form: one step at a time, with the side panel passed in. */
export function FormMode({
  def,
  data,
  onSet,
  checks,
  fieldLevel,
  suggestions,
  onAccept,
  onDismiss,
  stepIndex,
  onStep,
  onFinish,
  finishLabel,
  profile,
  question,
  aside,
}: {
  def: FrameworkDef;
  data: Data;
  onSet: (key: string, value: unknown) => void;
  checks: Check[];
  fieldLevel: Map<string, CheckLevel>;
  suggestions: Data;
  onAccept: (key: string) => void;
  onDismiss: (key: string) => void;
  stepIndex: number;
  onStep: (index: number) => void;
  onFinish: () => void;
  finishLabel: string;
  profile: Data;
  question: string;
  aside: React.ReactNode;
}) {
  const { t, tx } = useT();
  const steps = stepsOf(def);
  const step = steps[stepIndex];
  const stepSuggestionKeys = step.fields.map((f) => f.key).filter((k) => k in suggestions);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[200px_minmax(0,1fr)_320px]">
      <nav className="lg:sticky lg:top-20 lg:self-start">
        <ol className="flex gap-1 overflow-x-auto lg:flex-col">
          {steps.map((s, i) => {
            const pct = stepCompletion(s, data);
            const issues = checks.filter((c) => c.level !== "ok" && c.field && s.fields.some((f) => f.key === c.field)).length;
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onStep(i)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    i === stepIndex ? "bg-card font-medium shadow-sm ring-1 ring-line" : "text-muted hover:bg-black/5 hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                      pct === 1 ? "bg-ok text-white" : pct > 0 ? "bg-accent-soft text-accent" : "bg-black/5 text-muted",
                    )}
                  >
                    {pct === 1 ? "✓" : i + 1}
                  </span>
                  <span className="flex-1">{tx(s.title)}</span>
                  {issues > 0 && <span className="size-1.5 rounded-full bg-warn" />}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <Card className="p-6">
        <h3 className="text-lg font-semibold">{tx(step.title)}</h3>
        {step.intro && <p className="mt-1 text-sm leading-relaxed text-muted">{tx(step.intro)}</p>}
        {stepSuggestionKeys.length > 1 && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-accent-soft/60 px-3 py-2 text-sm">
            <span className="text-accent">
              ✦ {t("ws.suggestion")}: {stepSuggestionKeys.length}
            </span>
            <Button size="sm" variant="secondary" onClick={() => stepSuggestionKeys.forEach(onAccept)}>
              {t("ws.acceptAll")}
            </Button>
          </div>
        )}
        <div className="mt-6 space-y-7">
          {step.fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={data[field.key]}
              onChange={(v) => onSet(field.key, v)}
              level={fieldLevel.get(field.key)}
              actions={<FieldShortcuts field={field} data={data} profile={profile} question={question} onSet={onSet} />}
              below={
                field.key in suggestions ? (
                  <SuggestionCard field={field} value={suggestions[field.key]} onAccept={() => onAccept(field.key)} onDismiss={() => onDismiss(field.key)} />
                ) : null
              }
            />
          ))}
        </div>
        <div className="mt-8 flex justify-between border-t border-line pt-4">
          <Button variant="ghost" disabled={stepIndex === 0} onClick={() => onStep(stepIndex - 1)}>
            ← {t("common.previous")}
          </Button>
          {stepIndex < steps.length - 1 ? (
            <Button onClick={() => onStep(stepIndex + 1)}>{t("common.next")} →</Button>
          ) : (
            <Button onClick={onFinish}>{finishLabel} →</Button>
          )}
        </div>
      </Card>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">{aside}</aside>
    </div>
  );
}

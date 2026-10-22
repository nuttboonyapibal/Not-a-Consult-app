"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { isFilled } from "@/frameworks/helpers";
import { getFramework, runChecks, stepCompletion, stepsOf } from "@/frameworks/registry";
import type { Check, CheckLevel, Data, FieldDef } from "@/frameworks/types";
import { FieldInput } from "@/components/fields/field-input";
import { SaveIndicator } from "@/components/fields/save-indicator";
import { useAutosave } from "@/components/fields/use-autosave";
import { AnalysisStatusBadge } from "@/components/status";
import { Badge, Button, Card, cn } from "@/components/ui";
import { FrameworkView } from "@/components/views/framework-view";
import { deleteAnalysis, patchAnalysis, setAnalysisStatus } from "@/lib/actions/analyses";
import { useT } from "@/lib/i18n/client";
import type { Analysis } from "@/lib/types";
import { ChecksList, levelOrder } from "./checks-list";
import { SuggestionCard } from "./suggestion-card";

interface ReviewItem {
  level: CheckLevel;
  field: string | null;
  message: string;
}

const omit = <T extends object>(obj: T, key: string): T => {
  const copy = { ...obj } as Record<string, unknown>;
  delete copy[key];
  return copy as T;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? res.statusText);
  return json as T;
}

export function Workspace({
  projectId,
  analysis,
  question,
  profile,
  aiEnabled,
  demo,
}: {
  projectId: string;
  analysis: Analysis;
  question: string;
  profile: Data;
  aiEnabled: boolean;
  /** Sample data only: nothing is saved. */
  demo?: boolean;
}) {
  const { t, tx, lang } = useT();
  const router = useRouter();
  const def = getFramework(analysis.framework_key)!;
  const steps = stepsOf(def);
  const { data, setField, state } = useAutosave(analysis.data, (patch) =>
    demo ? Promise.resolve({ ok: true as const, data: undefined }) : patchAnalysis(analysis.id, patch),
  );
  const [mode, setMode] = useState<"fill" | "view">("fill");
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState(analysis.status);
  const [suggestions, setSuggestions] = useState<Data>({});
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [review, setReview] = useState<{ items: ReviewItem[]; summary: string } | null>(null);
  const [aiPending, setAiPending] = useState<"draft" | "review" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [pending, start] = useTransition();

  const checks = runChecks(def, data);
  const fieldLevel = new Map<string, CheckLevel>();
  for (const c of checks) {
    if (!c.field || c.level === "ok") continue;
    const prev = fieldLevel.get(c.field);
    if (!prev || levelOrder[c.level] > levelOrder[prev]) fieldLevel.set(c.field, c.level);
  }

  const step = steps[stepIndex];
  const stepOfField = (key: string) => steps.findIndex((s) => s.fields.some((f) => f.key === key));

  const goToField = (key: string) => {
    const idx = stepOfField(key);
    if (idx < 0) return;
    setMode("fill");
    setStepIndex(idx);
    setTimeout(() => document.getElementById(`f-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  async function draftStep() {
    setAiPending("draft");
    setAiError(null);
    try {
      const res = await postJson<{ values: Data; notes: string }>("/api/ai/assist", { analysisId: analysis.id, stepId: step.id, data });
      const filled = Object.fromEntries(Object.entries(res.values).filter(([, v]) => isFilled(v)));
      setSuggestions((s) => ({ ...s, ...filled }));
      setAiNotes(res.notes || null);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiPending(null);
    }
  }

  async function runReview() {
    setAiPending("review");
    setAiError(null);
    try {
      setReview(await postJson<{ items: ReviewItem[]; summary: string }>("/api/ai/review", { analysisId: analysis.id, data }));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiPending(null);
    }
  }

  const accept = (key: string) => {
    setField(key, suggestions[key]);
    setSuggestions((s) => omit(s, key));
  };
  const dismiss = (key: string) => setSuggestions((s) => omit(s, key));
  const stepSuggestionKeys = step.fields.map((f) => f.key).filter((k) => k in suggestions);

  const changeStatus = (next: typeof status) =>
    start(async () => {
      if (demo) return setStatus(next);
      const res = await setAnalysisStatus(projectId, analysis.id, next);
      if (res.ok) setStatus(next);
    });

  const helperActions = (field: FieldDef) => {
    const out: React.ReactNode[] = [];
    const empty = !isFilled(data[field.key]);
    if (empty && field.profileKey && isFilled(profile[field.profileKey])) {
      const value = profile[field.profileKey];
      out.push(
        <button
          key="profile"
          type="button"
          className="rounded-md px-2 py-0.5 text-xs text-accent hover:bg-accent-soft"
          onClick={() =>
            setField(field.key, field.type === "list" ? (Array.isArray(value) ? value : [String(value)]) : Array.isArray(value) ? value.join(", ") : value)
          }
        >
          ↙ {t("ws.useProfile")}
        </button>,
      );
    }
    if (empty && field.fromQuestion && question) {
      out.push(
        <button key="question" type="button" className="rounded-md px-2 py-0.5 text-xs text-accent hover:bg-accent-soft" onClick={() => setField(field.key, question)}>
          ↙ {t("ws.useQuestion")}
        </button>,
      );
    }
    return out.length ? out : undefined;
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href={demo ? "/demo" : `/projects/${projectId}`} className="text-sm text-muted hover:text-ink">
            ← {t("ws.question")}: {question}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{tx(def.name)}</h2>
            <AnalysisStatusBadge status={status} />
            {!def.structured && <Badge>{t("wizard.generic")}</Badge>}
          </div>
          <p className="text-sm text-muted">{tx(def.question)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveIndicator state={state} />
          <div className="flex rounded-lg border border-line bg-card p-0.5">
            {(["fill", "view"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn("rounded-md px-3 py-1.5 text-sm", mode === m ? "bg-ink text-white" : "text-muted hover:text-ink")}
              >
                {m === "fill" ? t("ws.fill") : t("ws.view")}
              </button>
            ))}
          </div>
          {status === "done" ? (
            <Button variant="secondary" size="sm" disabled={pending} onClick={() => changeStatus("in_progress")}>
              {t("ws.reopen")}
            </Button>
          ) : (
            <Button variant="secondary" size="sm" disabled={pending} onClick={() => changeStatus("done")}>
              ✓ {t("ws.markDone")}
            </Button>
          )}
        </div>
      </div>

      {mode === "view" ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <FrameworkView frameworkKey={def.key} data={data} lang={lang} />
          <aside>
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold">{t("ws.checks")}</h3>
              <ChecksList checks={checks} onSelect={goToField} />
            </Card>
          </aside>
        </div>
      ) : (
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
                      onClick={() => setStepIndex(i)}
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
                <span className="text-accent">✦ {t("ws.suggestion")}: {stepSuggestionKeys.length}</span>
                <Button size="sm" variant="secondary" onClick={() => stepSuggestionKeys.forEach(accept)}>
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
                  onChange={(v) => setField(field.key, v)}
                  level={fieldLevel.get(field.key)}
                  actions={helperActions(field)}
                  below={
                    field.key in suggestions ? (
                      <SuggestionCard field={field} value={suggestions[field.key]} onAccept={() => accept(field.key)} onDismiss={() => dismiss(field.key)} />
                    ) : null
                  }
                />
              ))}
            </div>
            <div className="mt-8 flex justify-between border-t border-line pt-4">
              <Button variant="ghost" disabled={stepIndex === 0} onClick={() => setStepIndex((i) => i - 1)}>
                ← {t("common.previous")}
              </Button>
              {stepIndex < steps.length - 1 ? (
                <Button onClick={() => setStepIndex((i) => i + 1)}>{t("common.next")} →</Button>
              ) : (
                <Button onClick={() => setMode("view")}>{t("ws.view")} →</Button>
              )}
            </div>
          </Card>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Card className="p-4">
              <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">{t("fw.howTo")}</h3>
              <p className="text-sm leading-relaxed">{tx(def.howTo)}</p>
              <h3 className="mt-4 mb-1 text-xs font-semibold tracking-wide text-warn uppercase">{t("fw.trap")}</h3>
              <p className="text-sm leading-relaxed">{tx(def.trap)}</p>
              {def.example && (
                <button type="button" onClick={() => setShowExample(true)} className="mt-4 text-sm font-medium text-accent hover:underline">
                  {t("fw.seeExample")} →
                </button>
              )}
              {!def.structured && <p className="mt-4 rounded-lg bg-paper p-2.5 text-xs text-muted">{t("fw.genericNote")}</p>}
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">AI</h3>
              {aiEnabled ? (
                <div className="space-y-2">
                  <Button variant="secondary" size="sm" className="w-full" disabled={!!aiPending} onClick={draftStep}>
                    ✦ {aiPending === "draft" ? t("ws.aiWorking") : t("ws.aiDraft")}
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full" disabled={!!aiPending} onClick={runReview}>
                    ✦ {aiPending === "review" ? t("ws.aiWorking") : t("ws.aiReview")}
                  </Button>
                  {aiError && <p className="rounded-lg bg-err-soft px-3 py-2 text-xs text-err">{aiError}</p>}
                  {aiNotes && (
                    <div className="rounded-lg bg-accent-soft/50 p-3 text-xs leading-relaxed">
                      <div className="mb-1 font-semibold text-accent">{t("ws.aiNotes")}</div>
                      {aiNotes}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-muted">{t(demo ? "demo.aiNote" : "ws.aiOff")}</p>
              )}
            </Card>

            {review && (
              <Card className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">✦ {t("ws.aiReviewTitle")}</h3>
                  <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => setReview(null)}>
                    ✕
                  </button>
                </div>
                {review.summary && <p className="mb-3 text-sm leading-relaxed">{review.summary}</p>}
                <ChecksList
                  checks={review.items.map<Check>((item, i) => ({
                    id: `ai-${i}`,
                    level: item.level,
                    field: item.field ?? undefined,
                    message: { th: item.message, en: item.message },
                  }))}
                  onSelect={goToField}
                />
              </Card>
            )}

            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold">{t("ws.checks")}</h3>
              <ChecksList checks={checks} onSelect={goToField} />
            </Card>

            {!demo && (
              <button
                type="button"
                className="w-full text-center text-xs text-faint hover:text-err"
                onClick={() => {
                  if (!confirm(t("common.confirmDelete"))) return;
                  start(async () => {
                    await deleteAnalysis(projectId, analysis.id);
                    router.push(`/projects/${projectId}`);
                  });
                }}
              >
                {t("ws.deleteAnalysis")}
              </button>
            )}
          </aside>
        </div>
      )}

      {showExample && def.example && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-10" onClick={() => setShowExample(false)}>
          <div className="w-full max-w-5xl rounded-2xl bg-paper p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">
                {t("common.example")}: {tx(def.name)}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowExample(false)}>
                ✕
              </Button>
            </div>
            <FrameworkView frameworkKey={def.key} data={def.example} lang={lang} />
          </div>
        </div>
      )}
    </div>
  );
}

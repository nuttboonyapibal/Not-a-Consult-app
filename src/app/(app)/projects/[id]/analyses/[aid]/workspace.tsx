"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { isFilled, moveItem } from "@/frameworks/helpers";
import { fieldOrder, fieldsOf, getFramework, nextEmptyField, runChecks, stepsOf } from "@/frameworks/registry";
import type { CheckLevel, Data, TagColor } from "@/frameworks/types";
import type { DragItem, EditApi } from "@/components/canvas/edit-api";
import { SaveIndicator } from "@/components/fields/save-indicator";
import { useAutosave } from "@/components/fields/use-autosave";
import { AnalysisStatusBadge } from "@/components/status";
import { Badge, Button, cn } from "@/components/ui";
import { EDITABLE_VIEWS, FrameworkView } from "@/components/views/framework-view";
import { deleteAnalysis, patchAnalysis, setAnalysisStatus } from "@/lib/actions/analyses";
import { useT } from "@/lib/i18n/client";
import type { Analysis } from "@/lib/types";
import { CanvasHelper } from "./canvas-helper";
import { levelOrder } from "./checks-list";
import { FormMode } from "./form-mode";
import { AiCard, ChecksCard, DeleteLink, GuideCard, ReviewCard, type AiPending, type ReviewItem } from "./side-cards";

type Mode = "canvas" | "form" | "view";

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
  const canvasCapable = def.structured && EDITABLE_VIEWS.has(def.view);
  const { data, setField, setFields, state } = useAutosave(analysis.data, (patch) =>
    demo ? Promise.resolve({ ok: true as const, data: undefined }) : patchAnalysis(analysis.id, patch),
  );
  const [mode, setMode] = useState<Mode>(canvasCapable ? "canvas" : "form");
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<TagColor | null>(null);
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [status, setStatus] = useState(analysis.status);
  const [suggestions, setSuggestions] = useState<Data>({});
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [review, setReview] = useState<{ items: ReviewItem[]; summary: string } | null>(null);
  const [aiPending, setAiPending] = useState<AiPending>(null);
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
  const order = fieldOrder(def);
  const firstEmpty = nextEmptyField(def, data);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  const select = (key: string | null) => {
    setSelected(key);
    if (key) setTimeout(() => document.getElementById(`f-${key}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  };

  const goToField = (key: string) => {
    if (mode === "canvas") return select(key);
    const idx = stepsOf(def).findIndex((s) => s.fields.some((f) => f.key === key));
    if (idx < 0) return;
    setMode("form");
    setStepIndex(idx);
    setTimeout(() => document.getElementById(`f-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  async function draft(body: { stepId?: string; fieldKeys?: string[] }, kind: "draft" | "draftEmpty") {
    setAiPending(kind);
    setAiError(null);
    try {
      const res = await postJson<{ values: Data; notes: string }>("/api/ai/assist", { analysisId: analysis.id, data, ...body });
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
  const acceptAll = () => {
    setFields(suggestions);
    setSuggestions({});
  };

  const changeStatus = (next: typeof status) =>
    start(async () => {
      if (demo) return setStatus(next);
      const res = await setAnalysisStatus(projectId, analysis.id, next);
      if (res.ok) setStatus(next);
    });

  const remove = () =>
    start(async () => {
      await deleteAnalysis(projectId, analysis.id);
      router.push(`/projects/${projectId}`);
    });

  const edit: EditApi = {
    onChange: setField,
    onPatch: setFields,
    selected,
    onSelect: select,
    levelOf: (key) => fieldLevel.get(key),
    orderOf: (key) => order.indexOf(key) + 1,
    isNext: (key) => key === firstEmpty,
    hasSuggestion: (key) => key in suggestions,
    activeTag,
    onTagFilter: setActiveTag,
    listTargets: fieldsOf(def)
      .filter((f) => f.type === "list")
      .map((f) => ({ key: f.key, label: tx(f.label) })),
    drag,
    setDrag,
    moveItem: (from, to) => setFields(moveItem(data, from, to)),
  };

  const modes: Mode[] = canvasCapable ? ["canvas", "form"] : ["form", "view"];
  const modeLabel: Record<Mode, string> = { canvas: t("canvas.modeCanvas"), form: t("canvas.modeForm"), view: t("ws.view") };

  const helper = (
    <CanvasHelper
      def={def}
      data={data}
      selected={selected}
      onSelect={select}
      onSet={setField}
      checks={checks}
      suggestions={suggestions}
      onAccept={accept}
      onDismiss={dismiss}
      onAcceptAll={acceptAll}
      aiEnabled={aiEnabled}
      demo={demo}
      aiPending={aiPending}
      aiError={aiError}
      aiNotes={aiNotes}
      onDraft={(keys, kind) => draft({ fieldKeys: keys }, kind)}
      onReview={runReview}
      review={review}
      onCloseReview={() => setReview(null)}
      profile={profile}
      question={question}
      onShowExample={() => setShowExample(true)}
      footer={!demo && <DeleteLink onDelete={remove} />}
    />
  );

  const formAside = (
    <>
      <GuideCard def={def} onShowExample={() => setShowExample(true)} />
      <AiCard aiEnabled={aiEnabled} demo={demo} error={aiError} notes={aiNotes}>
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={!!aiPending}
          onClick={() => draft({ stepId: stepsOf(def)[stepIndex].id }, "draft")}
        >
          ✦ {aiPending === "draft" ? t("ws.aiWorking") : t("ws.aiDraft")}
        </Button>
        <Button variant="secondary" size="sm" className="w-full" disabled={!!aiPending} onClick={runReview}>
          ✦ {aiPending === "review" ? t("ws.aiWorking") : t("ws.aiReview")}
        </Button>
      </AiCard>
      {review && <ReviewCard review={review} onClose={() => setReview(null)} onSelect={goToField} />}
      <ChecksCard checks={checks} onSelect={goToField} />
      {!demo && <DeleteLink onDelete={remove} />}
    </>
  );

  return (
    <div className={cn(mode === "canvas" && selected && "max-lg:pb-[55vh]")}>
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
          <div className="flex rounded-lg border border-line bg-card p-0.5" role="tablist">
            {modes.map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn("rounded-md px-3 py-1.5 text-sm", mode === m ? "bg-ink text-white" : "text-muted hover:text-ink")}
              >
                {modeLabel[m]}
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

      {mode === "canvas" && (
        <>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <FrameworkView frameworkKey={def.key} data={data} lang={lang} edit={edit} />
            </div>
            <aside className="hidden lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">{helper}</aside>
          </div>
          <div className="lg:hidden">
            {selected ? (
              <div className="fixed inset-x-0 bottom-0 z-40 max-h-[55vh] overflow-y-auto rounded-t-2xl border-t border-line bg-paper p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
                {helper}
              </div>
            ) : (
              <div className="mt-6">{helper}</div>
            )}
          </div>
        </>
      )}

      {mode === "view" && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <FrameworkView frameworkKey={def.key} data={data} lang={lang} />
          <aside>
            <ChecksCard checks={checks} onSelect={goToField} />
          </aside>
        </div>
      )}

      {mode === "form" && (
        <FormMode
          def={def}
          data={data}
          onSet={setField}
          checks={checks}
          fieldLevel={fieldLevel}
          suggestions={suggestions}
          onAccept={accept}
          onDismiss={dismiss}
          stepIndex={stepIndex}
          onStep={setStepIndex}
          onFinish={() => setMode(canvasCapable ? "canvas" : "view")}
          finishLabel={canvasCapable ? t("canvas.modeCanvas") : t("ws.view")}
          profile={profile}
          question={question}
          aside={formAside}
        />
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

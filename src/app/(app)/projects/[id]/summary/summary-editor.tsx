"use client";

import { useState, useTransition } from "react";
import { templateSummary, type ProjectSummary, type SummaryInput } from "@/frameworks/summary";
import type { Lang } from "@/frameworks/types";
import { Badge, Button, Card, cn, Input, Label, Textarea } from "@/components/ui";
import { saveSummary } from "@/lib/actions/summary";
import { useT } from "@/lib/i18n/client";

type Source = "ai" | "template" | "manual";
const rid = () => Math.random().toString(36).slice(2, 10);
const isEmpty = (s: ProjectSummary) =>
  !s.exec_summary.conclusion && s.exec_summary.reasons.length === 0 && s.decisions.length === 0 && !s.action_plan.objective;

export function SummaryEditor({
  projectId,
  initial,
  initialSource,
  items,
  aiEnabled,
  reportLang,
  demo,
}: {
  projectId: string;
  initial: ProjectSummary;
  initialSource: Source | null;
  items: SummaryInput[];
  aiEnabled: boolean;
  reportLang: Lang;
  /** Sample data only: nothing is saved. */
  demo?: boolean;
}) {
  const { t } = useT();
  const [summary, setSummary] = useState(initial);
  const [source, setSource] = useState<Source | null>(initialSource);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiPending, setAiPending] = useState(false);
  const [pending, start] = useTransition();

  const update = (fn: (s: ProjectSummary) => ProjectSummary) => {
    setSummary(fn);
    setDirty(true);
    setSaved(false);
  };

  const replaceWith = (next: ProjectSummary, from: Source) => {
    if (!isEmpty(summary) && !confirm(t("summary.replaceConfirm"))) return;
    setSummary(next);
    setSource(from);
    setDirty(true);
    setSaved(false);
  };

  async function fromAi() {
    setAiPending(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? res.statusText);
      replaceWith(body, "ai");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiPending(false);
    }
  }

  const save = () =>
    start(async () => {
      const res = demo ? { ok: true as const, data: undefined } : await saveSummary(projectId, summary, source ?? "manual");
      if (res.ok) {
        setDirty(false);
        setSaved(true);
      } else setError(res.error);
    });

  const { exec_summary: exec, decisions, action_plan: plan } = summary;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => replaceWith(templateSummary(items, reportLang), "template")}>
          {t("summary.fromTemplate")}
        </Button>
        {aiEnabled && (
          <Button variant="secondary" size="sm" disabled={aiPending} onClick={fromAi}>
            ✦ {aiPending ? t("ws.aiWorking") : t("summary.fromAi")}
          </Button>
        )}
        {source && <Badge tone={source === "ai" ? "accent" : "neutral"}>{t(`summary.source.${source}`)}</Badge>}
        <div className="ml-auto flex items-center gap-3">
          {dirty && <span className="text-xs text-warn">{t("summary.unsaved")}</span>}
          {saved && <span className="text-xs text-ok">✓ {t("common.saved")}</span>}
          <Button disabled={pending || !dirty} onClick={save}>
            {pending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>
      {error && <p className="rounded-lg bg-err-soft px-3 py-2 text-sm text-err">{error}</p>}

      <Card className="p-6">
        <h3 className="mb-4 font-semibold">{t("summary.exec")}</h3>
        <Label htmlFor="conclusion">{t("summary.conclusion")}</Label>
        <Textarea
          id="conclusion"
          rows={3}
          value={exec.conclusion}
          onChange={(e) => update((s) => ({ ...s, exec_summary: { ...s.exec_summary, conclusion: e.target.value } }))}
          className="text-base"
        />
        <div className="mt-5 mb-2 text-sm font-medium">{t("summary.reasons")}</div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => {
            const r = exec.reasons[i] ?? { title: "", detail: "" };
            const setReason = (patch: Partial<typeof r>) =>
              update((s) => {
                const reasons = [...s.exec_summary.reasons];
                while (reasons.length <= i) reasons.push({ title: "", detail: "" });
                reasons[i] = { ...reasons[i], ...patch };
                return { ...s, exec_summary: { ...s.exec_summary, reasons } };
              });
            return (
              <div key={i} className="grid gap-2 rounded-lg border border-line p-3 md:grid-cols-[24px_1fr]">
                <div className="text-sm font-semibold text-accent">{i + 1}</div>
                <div className="space-y-2">
                  <Input placeholder={t("summary.reasonTitle")} value={r.title} onChange={(e) => setReason({ title: e.target.value })} />
                  <Textarea rows={2} placeholder={t("summary.reasonDetail")} value={r.detail} onChange={(e) => setReason({ detail: e.target.value })} className="min-h-16 text-xs" />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-semibold">{t("summary.decisions")}</h3>
        <div className="space-y-3">
          {decisions.map((d) => {
            const setD = (patch: Partial<typeof d>) =>
              update((s) => ({ ...s, decisions: s.decisions.map((x) => (x.id === d.id ? { ...x, ...patch } : x)) }));
            return (
              <div key={d.id} className="rounded-lg border border-line p-3">
                <div className="mb-2 flex items-center gap-2">
                  {(["decision", "hypothesis"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setD({ kind: k })}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs",
                        d.kind === k ? (k === "decision" ? "border-ok bg-ok-soft text-ok" : "border-warn bg-warn-soft text-warn") : "border-line text-muted",
                      )}
                    >
                      {t(`summary.${k}`)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="ml-auto text-xs text-faint hover:text-err"
                    onClick={() => update((s) => ({ ...s, decisions: s.decisions.filter((x) => x.id !== d.id) }))}
                  >
                    {t("common.remove")}
                  </button>
                </div>
                <Textarea rows={2} value={d.text} onChange={(e) => setD({ text: e.target.value })} className="min-h-14" />
                {d.kind === "hypothesis" && (
                  <Input className="mt-2" placeholder={t("summary.test")} value={d.test} onChange={(e) => setD({ test: e.target.value })} />
                )}
              </div>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update((s) => ({ ...s, decisions: [...s.decisions, { id: rid(), kind: "decision", text: "", test: "" }] }))}
          >
            + {t("common.add")}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-semibold">{t("summary.actionPlan")}</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_200px]">
          <div>
            <Label htmlFor="objective">{t("summary.objective")}</Label>
            <Input id="objective" value={plan.objective} onChange={(e) => update((s) => ({ ...s, action_plan: { ...s.action_plan, objective: e.target.value } }))} />
          </div>
          <div>
            <Label htmlFor="period">{t("summary.period")}</Label>
            <Input id="period" value={plan.period} onChange={(e) => update((s) => ({ ...s, action_plan: { ...s.action_plan, period: e.target.value } }))} />
          </div>
        </div>
        <RowsEditor
          title={t("summary.keyResults")}
          rows={plan.keyResults}
          columns={[
            { key: "text", label: t("summary.keyResults"), width: "1fr" },
            { key: "target", label: t("summary.target"), width: "120px" },
            { key: "owner", label: t("summary.owner"), width: "140px" },
          ]}
          onChange={(keyResults) => update((s) => ({ ...s, action_plan: { ...s.action_plan, keyResults } }))}
          blank={() => ({ id: rid(), text: "", target: "", owner: "" })}
        />
        <RowsEditor
          title={t("summary.tasks")}
          rows={plan.tasks}
          columns={[
            { key: "task", label: t("summary.task"), width: "1fr" },
            { key: "owner", label: t("summary.owner"), width: "140px" },
            { key: "due", label: t("summary.due"), width: "120px" },
          ]}
          onChange={(tasks) => update((s) => ({ ...s, action_plan: { ...s.action_plan, tasks } }))}
          blank={() => ({ id: rid(), task: "", owner: "", due: "" })}
        />
      </Card>
    </div>
  );
}

function RowsEditor<R extends { id: string } & Record<string, string>>({
  title,
  rows,
  columns,
  onChange,
  blank,
}: {
  title: string;
  rows: R[];
  columns: { key: keyof R & string; label: string; width: string }[];
  onChange: (rows: R[]) => void;
  blank: () => R;
}) {
  const { t } = useT();
  // Columns side by side from md up; stacked on phones.
  const grid = { "--cols": `${columns.map((c) => c.width).join(" ")} 28px` } as React.CSSProperties;
  const gridClass = "grid grid-cols-1 gap-2 md:[grid-template-columns:var(--cols)]";
  return (
    <div className="mt-5">
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div className="space-y-1.5">
        <div className={`${gridClass} hidden px-1 text-xs text-muted md:grid`} style={grid}>
          {columns.map((c) => (
            <span key={c.key}>{c.label}</span>
          ))}
        </div>
        {rows.map((row) => (
          <div key={row.id} className={`${gridClass} rounded-lg border border-line p-2 md:items-center md:border-0 md:p-0`} style={grid}>
            {columns.map((c) => (
              <Input
                key={c.key}
                aria-label={c.label}
                value={row[c.key]}
                className="h-9"
                onChange={(e) => onChange(rows.map((r) => (r.id === row.id ? { ...r, [c.key]: e.target.value } : r)))}
              />
            ))}
            <button type="button" className="text-faint hover:text-err" aria-label={t("common.remove")} onClick={() => onChange(rows.filter((r) => r.id !== row.id))}>
              ✕
            </button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => onChange([...rows, blank()])}>
          + {t("common.add")}
        </Button>
      </div>
    </div>
  );
}

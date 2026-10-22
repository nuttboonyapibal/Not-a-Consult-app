"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CATEGORIES } from "@/frameworks/catalog";
import { FRAMEWORKS, getFramework } from "@/frameworks/registry";
import { guessCategory, recommend } from "@/frameworks/recommend";
import type { CategoryKey, FrameworkDef, L, Stage } from "@/frameworks/types";
import { Badge, Button, Card, cn, Label, Textarea } from "@/components/ui";
import { createQuestion } from "@/lib/actions/analyses";
import { useT } from "@/lib/i18n/client";

interface AiPick {
  key: string;
  reason: string;
}

const MAX_PICKS = 3;

export function QuestionWizard({
  projectId,
  stage,
  aiEnabled,
  preset,
}: {
  projectId: string;
  stage: Stage;
  aiEnabled: boolean;
  preset: string | null;
}) {
  const { t, tx, lang } = useT();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<CategoryKey | null>(preset ? getFramework(preset)!.category : null);
  const [picked, setPicked] = useState<string[]>(preset ? [preset] : []);
  const [browse, setBrowse] = useState(false);
  const [ai, setAi] = useState<{ picks: AiPick[]; refined: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPending, setAiPending] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const recs = useMemo(() => (step >= 3 ? recommend(question, stage, category) : []), [step, question, stage, category]);
  const recKeys = new Set([...recs.map((r) => r.framework.key), ...(ai?.picks.map((p) => p.key) ?? [])]);

  const toggle = (key: string) =>
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length >= MAX_PICKS ? p : [...p, key]));

  const goToCategory = () => {
    if (!category) setCategory(guessCategory(question));
    setStep(2);
  };

  async function askAi() {
    setAiPending(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, question, category }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? res.statusText);
      setAi(body);
      setPicked((p) => (p.length ? p : body.picks.slice(0, 2).map((x: AiPick) => x.key)));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiPending(false);
    }
  }

  function create() {
    setError(null);
    start(async () => {
      const res = await createQuestion({ projectId, text: question, category, frameworks: picked });
      if (res.ok) router.push(`/projects/${projectId}/analyses/${res.data.analysisId}`);
      else setError(res.error);
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-1 text-lg font-semibold">{t("wizard.title")}</h2>
      <ol className="mb-6 flex gap-2 text-xs">
        {[t("wizard.step1"), t("wizard.step2"), t("wizard.step3")].map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1",
              step === i + 1 ? "bg-accent text-white" : step > i + 1 ? "bg-accent-soft text-accent" : "bg-black/5 text-muted",
            )}
          >
            <span className="font-semibold">{i + 1}</span> {label}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <Card className="p-6">
          <Label htmlFor="q">{t("wizard.questionLabel")}</Label>
          <p className="mb-3 text-xs text-muted">{t("wizard.questionHint")}</p>
          <Textarea id="q" rows={3} autoFocus value={question} onChange={(e) => setQuestion(e.target.value)} />
          <div className="mt-4 flex justify-end">
            <Button disabled={!question.trim()} onClick={goToCategory}>
              {t("common.next")} →
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          <p className="mb-1 font-medium">“{question}”</p>
          <p className="mb-4 text-xs text-muted">{t("wizard.categoryHint")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  category === c.key ? "border-accent bg-accent-soft/60" : "border-line hover:bg-paper",
                )}
              >
                <div className="text-sm font-medium">{tx(c.question)}</div>
                <div className="text-xs text-muted">{tx(c.name)}</div>
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              ← {t("common.back")}
            </Button>
            <Button onClick={() => setStep(3)}>{t("common.next")} →</Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">“{question}”</p>
                <p className="text-xs text-muted">{t("wizard.pickHint")}</p>
              </div>
              {aiEnabled && (
                <Button variant="secondary" size="sm" onClick={askAi} disabled={aiPending}>
                  ✦ {aiPending ? t("wizard.aiThinking") : t("wizard.askAi")}
                </Button>
              )}
            </div>
            {aiError && <p className="mb-3 rounded-lg bg-err-soft px-3 py-2 text-sm text-err">{aiError}</p>}
            {ai?.refined && ai.refined.trim() !== question.trim() && (
              <div className="mb-4 rounded-lg border border-accent/20 bg-accent-soft/50 p-3 text-sm">
                <span className="text-muted">{t("wizard.aiRefined")}: </span>
                <span className="font-medium">“{ai.refined}”</span>
                <Button variant="ghost" size="sm" className="ml-2" onClick={() => setQuestion(ai.refined)}>
                  {t("wizard.useThis")}
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {ai?.picks.map((p) => {
                const def = getFramework(p.key);
                return def ? (
                  <FrameworkOption
                    key={`ai-${p.key}`}
                    def={def}
                    checked={picked.includes(p.key)}
                    onToggle={() => toggle(p.key)}
                    badge={<Badge tone="accent">✦ AI</Badge>}
                    reasons={[p.reason]}
                  />
                ) : null;
              })}
              {recs
                .filter((r) => !ai?.picks.some((p) => p.key === r.framework.key))
                .map((r, i) => (
                  <FrameworkOption
                    key={r.framework.key}
                    def={r.framework}
                    checked={picked.includes(r.framework.key)}
                    onToggle={() => toggle(r.framework.key)}
                    badge={i === 0 && !ai ? <Badge tone="accent">{t("wizard.recommended")}</Badge> : null}
                    reasons={r.reasons.map((x: L) => x[lang])}
                  />
                ))}
            </div>
            <button type="button" className="mt-4 text-sm font-medium text-accent hover:underline" onClick={() => setBrowse((b) => !b)}>
              {browse ? "−" : "+"} {t("wizard.browseAll")}
            </button>
            {browse && (
              <div className="mt-3 space-y-4">
                {CATEGORIES.map((c) => (
                  <div key={c.key}>
                    <div className="mb-1.5 text-xs font-semibold text-muted">{tx(c.name)}</div>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {FRAMEWORKS.filter((f) => f.category === c.key && !recKeys.has(f.key)).map((f) => (
                        <FrameworkOption key={f.key} def={f} compact checked={picked.includes(f.key)} onToggle={() => toggle(f.key)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          {error && <p className="rounded-lg bg-err-soft px-3 py-2 text-sm text-err">{error}</p>}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              ← {t("common.back")}
            </Button>
            <div className="flex items-center gap-3">
              {picked.length >= MAX_PICKS && <span className="text-xs text-muted">{t("wizard.tooMany")}</span>}
              <Button disabled={picked.length === 0 || pending} onClick={create}>
                {t("wizard.create")} ({picked.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FrameworkOption({
  def,
  checked,
  onToggle,
  badge,
  reasons,
  compact,
}: {
  def: FrameworkDef;
  checked: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  reasons?: string[];
  compact?: boolean;
}) {
  const { t, tx } = useT();
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border transition-colors",
        compact ? "p-2.5" : "p-4",
        checked ? "border-accent bg-accent-soft/50" : "border-line hover:bg-paper",
      )}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1 size-4 accent-accent" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className={cn("font-medium", compact && "text-sm")}>{tx(def.name)}</span>
          {badge}
          {!def.structured && !compact && <Badge>{t("wizard.generic")}</Badge>}
        </span>
        <span className="block text-xs text-muted">{tx(def.question)}</span>
        {!compact && (
          <>
            {reasons && reasons.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-xs text-ink/80">
                {reasons.map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            )}
            <span className="mt-2 block text-xs text-warn">
              {t("fw.trap")}: {tx(def.trap)}
            </span>
          </>
        )}
      </span>
    </label>
  );
}

"use client";

import { isFilled } from "@/frameworks/helpers";
import { fieldDef, fieldOrder, nextEmptyField } from "@/frameworks/registry";
import type { Check, Data, FrameworkDef } from "@/frameworks/types";
import { Button, Card, Progress } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { ChecksList } from "./checks-list";
import { AiCard, ChecksCard, FieldShortcuts, GuideCard, ReviewCard, type AiPending, type ReviewItem } from "./side-cards";
import { SuggestionCard } from "./suggestion-card";

/**
 * The panel beside the canvas: guidance for the selected field, or an
 * overview of the whole framework when nothing is selected.
 */
export function CanvasHelper({
  def,
  data,
  selected,
  onSelect,
  onSet,
  checks,
  suggestions,
  onAccept,
  onDismiss,
  onAcceptAll,
  aiEnabled,
  demo,
  aiPending,
  aiError,
  aiNotes,
  onDraft,
  onReview,
  review,
  onCloseReview,
  profile,
  question,
  onShowExample,
  footer,
}: {
  def: FrameworkDef;
  data: Data;
  selected: string | null;
  onSelect: (key: string | null) => void;
  onSet: (key: string, value: unknown) => void;
  checks: Check[];
  suggestions: Data;
  onAccept: (key: string) => void;
  onDismiss: (key: string) => void;
  onAcceptAll: () => void;
  aiEnabled: boolean;
  demo?: boolean;
  aiPending: AiPending;
  aiError: string | null;
  aiNotes: string | null;
  onDraft: (keys: string[], kind: "draft" | "draftEmpty") => void;
  onReview: () => void;
  review: { items: ReviewItem[]; summary: string } | null;
  onCloseReview: () => void;
  profile: Data;
  question: string;
  onShowExample: () => void;
  footer?: React.ReactNode;
}) {
  const { t, tx } = useT();
  const order = fieldOrder(def);
  const field = selected ? fieldDef(def, selected) : undefined;

  if (field) {
    const next = nextEmptyField(def, data, field.key);
    const fieldChecks = checks.filter((c) => c.field === field.key);
    return (
      <div className="space-y-3">
        <Card className="p-4">
          <div className="mb-2 flex items-start gap-2">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
              {order.indexOf(field.key) + 1}
            </span>
            <h3 className="flex-1 font-semibold">{tx(field.label)}</h3>
            <button type="button" onClick={() => onSelect(null)} className="rounded px-1.5 text-sm text-muted hover:bg-black/5 hover:text-ink" aria-label={t("canvas.close")}>
              ✕
            </button>
          </div>
          {field.hint && <p className="text-sm leading-relaxed text-ink/85">{tx(field.hint)}</p>}
          {field.example && (
            <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-xs leading-relaxed text-muted">
              {t("common.example")}: {tx(field.example)}
            </p>
          )}
          <div className="mt-2">
            <FieldShortcuts field={field} data={data} profile={profile} question={question} onSet={onSet} />
          </div>
          {fieldChecks.length > 0 && (
            <div className="mt-3 border-t border-line pt-3">
              <ChecksList checks={fieldChecks} />
            </div>
          )}
          {field.key in suggestions && (
            <SuggestionCard field={field} value={suggestions[field.key]} onAccept={() => onAccept(field.key)} onDismiss={() => onDismiss(field.key)} />
          )}
          {aiEnabled && (
            <Button variant="secondary" size="sm" className="mt-3 w-full" disabled={!!aiPending} onClick={() => onDraft([field.key], "draft")}>
              ✦ {aiPending === "draft" ? t("ws.aiWorking") : t("canvas.draftField")}
            </Button>
          )}
          {aiError && <p className="mt-2 rounded-lg bg-err-soft px-3 py-2 text-xs text-err">{aiError}</p>}
          <div className="mt-3 flex justify-end border-t border-line pt-3">
            {next ? (
              <Button size="sm" onClick={() => onSelect(next)}>
                {t("canvas.next")}: {tx(fieldDef(def, next)!.label)} →
              </Button>
            ) : (
              <span className="text-sm text-ok">✓ {t("canvas.allFilled")}</span>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const filled = order.filter((k) => isFilled(data[k])).length;
  const empty = order.filter((k) => !isFilled(data[k]));
  const pending = Object.keys(suggestions);
  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-semibold">{t("canvas.overview")}</span>
          <span className="text-muted tabular-nums">
            {t("canvas.filled")} {filled}/{order.length} {t("canvas.fields")}
          </span>
        </div>
        <Progress value={filled / order.length} />
        <p className="mt-3 text-xs leading-relaxed text-muted">{t("canvas.pickHint")}</p>
        {empty.length > 0 && (
          <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => onSelect(empty[0])}>
            {t("canvas.startHere")} →
          </Button>
        )}
      </Card>
      <GuideCard def={def} onShowExample={onShowExample} />
      <AiCard aiEnabled={aiEnabled} demo={demo} error={aiError} notes={aiNotes}>
        {empty.length > 0 && (
          <Button variant="secondary" size="sm" className="w-full" disabled={!!aiPending} onClick={() => onDraft(empty, "draftEmpty")}>
            ✦ {aiPending === "draftEmpty" ? t("ws.aiWorking") : t("canvas.draftEmpty")}
          </Button>
        )}
        <Button variant="secondary" size="sm" className="w-full" disabled={!!aiPending} onClick={onReview}>
          ✦ {aiPending === "review" ? t("ws.aiWorking") : t("ws.aiReview")}
        </Button>
        {pending.length > 0 && (
          <div className="rounded-lg border border-accent/25 bg-accent-soft/40 p-3 text-xs">
            <div className="mb-1 font-semibold text-accent">
              ✦ {t("canvas.pending")}: {pending.length}
            </div>
            <p className="mb-2 text-muted">{t("canvas.reviewEach")}</p>
            <Button size="sm" onClick={onAcceptAll}>
              {t("ws.acceptAll")}
            </Button>
          </div>
        )}
      </AiCard>
      {review && <ReviewCard review={review} onClose={onCloseReview} onSelect={onSelect} />}
      <ChecksCard checks={checks} onSelect={onSelect} />
      {footer}
    </div>
  );
}

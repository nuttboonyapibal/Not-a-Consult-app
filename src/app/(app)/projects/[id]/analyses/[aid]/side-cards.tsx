"use client";

import { isFilled, toItems } from "@/frameworks/helpers";
import type { Check, CheckLevel, Data, FieldDef, FrameworkDef } from "@/frameworks/types";
import { Button, Card } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { ChecksList } from "./checks-list";

export interface ReviewItem {
  level: CheckLevel;
  field: string | null;
  message: string;
}

export type AiPending = "draft" | "draftEmpty" | "review" | null;

export function GuideCard({ def, onShowExample }: { def: FrameworkDef; onShowExample: () => void }) {
  const { t, tx } = useT();
  return (
    <Card className="p-4">
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">{t("fw.howTo")}</h3>
      <p className="text-sm leading-relaxed">{tx(def.howTo)}</p>
      <h3 className="mt-4 mb-1 text-xs font-semibold tracking-wide text-warn uppercase">{t("fw.trap")}</h3>
      <p className="text-sm leading-relaxed">{tx(def.trap)}</p>
      {def.example && (
        <button type="button" onClick={onShowExample} className="mt-4 text-sm font-medium text-accent hover:underline">
          {t("fw.seeExample")} →
        </button>
      )}
      {!def.structured && <p className="mt-4 rounded-lg bg-paper p-2.5 text-xs text-muted">{t("fw.genericNote")}</p>}
    </Card>
  );
}

export function AiCard({
  aiEnabled,
  demo,
  error,
  notes,
  children,
}: {
  aiEnabled: boolean;
  demo?: boolean;
  error: string | null;
  notes: string | null;
  children: React.ReactNode;
}) {
  const { t } = useT();
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">AI</h3>
      {aiEnabled ? (
        <div className="space-y-2">
          {children}
          {error && <p className="rounded-lg bg-err-soft px-3 py-2 text-xs text-err">{error}</p>}
          {notes && (
            <div className="rounded-lg bg-accent-soft/50 p-3 text-xs leading-relaxed">
              <div className="mb-1 font-semibold text-accent">{t("ws.aiNotes")}</div>
              {notes}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-muted">{t(demo ? "demo.aiNote" : "ws.aiOff")}</p>
      )}
    </Card>
  );
}

export function ReviewCard({
  review,
  onClose,
  onSelect,
}: {
  review: { items: ReviewItem[]; summary: string };
  onClose: () => void;
  onSelect: (field: string) => void;
}) {
  const { t } = useT();
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">✦ {t("ws.aiReviewTitle")}</h3>
        <button type="button" className="text-xs text-muted hover:text-ink" onClick={onClose} aria-label={t("canvas.close")}>
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
        onSelect={onSelect}
      />
    </Card>
  );
}

export function ChecksCard({ checks, onSelect }: { checks: Check[]; onSelect: (field: string) => void }) {
  const { t } = useT();
  return (
    <Card className="p-4">
      <h3 className="mb-2 text-sm font-semibold">{t("ws.checks")}</h3>
      <ChecksList checks={checks} onSelect={onSelect} />
    </Card>
  );
}

/** "Use from the business profile" / "use the question" buttons for an empty field. */
export function FieldShortcuts({
  field,
  data,
  profile,
  question,
  onSet,
}: {
  field: FieldDef;
  data: Data;
  profile: Data;
  question: string;
  onSet: (key: string, value: unknown) => void;
}) {
  const { t } = useT();
  if (isFilled(data[field.key])) return null;
  const buttons: React.ReactNode[] = [];
  if (field.profileKey && isFilled(profile[field.profileKey])) {
    const value = profile[field.profileKey];
    const asList = Array.isArray(value) ? toItems(value).map((i) => i.text) : [String(value)];
    buttons.push(
      <button
        key="profile"
        type="button"
        className="rounded-md px-2 py-0.5 text-xs text-accent hover:bg-accent-soft"
        onClick={() =>
          onSet(field.key, field.type === "list" ? asList.map((text, i) => ({ id: `p${i}${Date.now().toString(36)}`, text })) : asList.join(", "))
        }
      >
        ↙ {t("ws.useProfile")}
      </button>,
    );
  }
  if (field.fromQuestion && question) {
    buttons.push(
      <button key="question" type="button" className="rounded-md px-2 py-0.5 text-xs text-accent hover:bg-accent-soft" onClick={() => onSet(field.key, question)}>
        ↙ {t("ws.useQuestion")}
      </button>,
    );
  }
  return buttons.length ? <div className="flex flex-wrap gap-1">{buttons}</div> : null;
}

export function DeleteLink({ onDelete }: { onDelete: () => void }) {
  const { t } = useT();
  return (
    <Button variant="ghost" size="sm" className="w-full text-xs text-faint hover:text-err" onClick={() => confirm(t("common.confirmDelete")) && onDelete()}>
      {t("ws.deleteAnalysis")}
    </Button>
  );
}

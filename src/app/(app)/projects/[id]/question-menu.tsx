"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CATEGORIES } from "@/frameworks/catalog";
import { FRAMEWORKS } from "@/frameworks/registry";
import { Button, Select } from "@/components/ui";
import { addAnalysis, deleteQuestion } from "@/lib/actions/analyses";
import { useT } from "@/lib/i18n/client";

export function QuestionMenu({ projectId, questionId, existing }: { projectId: string; questionId: string; existing: string[] }) {
  const { t, tx } = useT();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();

  if (adding) {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const key = new FormData(e.currentTarget).get("framework") as string;
          start(async () => {
            const res = await addAnalysis(projectId, questionId, key);
            if (res.ok) router.push(`/projects/${projectId}/analyses/${res.data.analysisId}`);
          });
        }}
      >
        <Select name="framework" className="h-8 w-56 text-xs" required defaultValue="">
          <option value="" disabled>
            {t("project.addFramework")}
          </option>
          {CATEGORIES.map((c) => (
            <optgroup key={c.key} label={tx(c.name)}>
              {FRAMEWORKS.filter((f) => f.category === c.key && !existing.includes(f.key)).map((f) => (
                <option key={f.key} value={f.key}>
                  {tx(f.name)}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
        <Button size="sm" disabled={pending}>
          {t("common.add")}
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setAdding(false)}>
          {t("common.cancel")}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>
        + {t("project.addFramework")}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          if (!confirm(t("common.confirmDelete"))) return;
          start(async () => {
            await deleteQuestion(projectId, questionId);
            router.refresh();
          });
        }}
        aria-label={t("project.deleteQuestion")}
        title={t("project.deleteQuestion")}
      >
        ✕
      </Button>
    </div>
  );
}

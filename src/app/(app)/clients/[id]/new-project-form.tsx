"use client";

import { useState } from "react";
import { STAGES } from "@/frameworks/catalog";
import { Button, Card, Input, Label } from "@/components/ui";
import { StagePicker } from "@/components/stage-picker";
import { createProjectAction } from "@/lib/actions/projects";
import { useT } from "@/lib/i18n/client";

export function NewProjectForm({ clientId }: { clientId: string }) {
  const { t, lang } = useT();
  const [pending, setPending] = useState(false);
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">{t("dash.newProject")}</h2>
      <form
        action={async (fd) => {
          setPending(true);
          await createProjectAction(fd);
        }}
        className="space-y-4"
      >
        <input type="hidden" name="clientId" value={clientId} />
        <div>
          <Label htmlFor="project-name">{t("project.name")}</Label>
          <Input id="project-name" name="name" required placeholder={t("project.namePlaceholder")} />
        </div>
        <div>
          <Label>{t("project.stage")}</Label>
          <StagePicker name="stage" defaultValue={STAGES[1].key} />
        </div>
        <div>
          <Label htmlFor="report-lang">{t("project.reportLang")}</Label>
          <select id="report-lang" name="reportLang" defaultValue={lang} className="h-10 w-full rounded-lg border border-line bg-card px-3 text-sm">
            <option value="th">ภาษาไทย</option>
            <option value="en">English</option>
          </select>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-line p-3">
          <input type="checkbox" name="aiEnabled" defaultChecked className="mt-1 size-4 accent-accent" />
          <span>
            <span className="block text-sm font-medium">{t("project.ai")}</span>
            <span className="block text-xs leading-relaxed text-muted">{t("project.aiHelp")}</span>
          </span>
        </label>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? t("common.loading") : t("common.create")}
        </Button>
      </form>
    </Card>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { StagePicker } from "@/components/stage-picker";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { addMember, deleteProject, removeMember, updateProjectSettings } from "@/lib/actions/projects";
import { useT } from "@/lib/i18n/client";
import type { Profile, Project } from "@/lib/types";

const STATUSES = ["draft", "waiting_client", "analyzing", "summarized"] as const;

export function ProjectSettingsForm({
  project,
  team,
  memberIds,
  canDelete,
}: {
  project: Project;
  team: Profile[];
  memberIds: string[];
  canDelete: boolean;
}) {
  const { t } = useT();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMember, setNewMember] = useState("");
  const [pending, start] = useTransition();
  const members = team.filter((p) => memberIds.includes(p.id));
  const others = team.filter((p) => !memberIds.includes(p.id));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form
          action={(fd) =>
            start(async () => {
              setError(null);
              const res = await updateProjectSettings(project.id, fd);
              if (res.ok) {
                setSaved(true);
                router.refresh();
              } else setError(res.error);
            })
          }
          onChange={() => setSaved(false)}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="name">{t("project.name")}</Label>
            <Input id="name" name="name" defaultValue={project.name} required />
          </div>
          <div>
            <Label>{t("project.stage")}</Label>
            <StagePicker name="stage" defaultValue={project.stage} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="status">{t("project.status")}</Label>
              <Select id="status" name="status" defaultValue={project.status}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="reportLang">{t("project.reportLang")}</Label>
              <Select id="reportLang" name="reportLang" defaultValue={project.report_lang}>
                <option value="th">ภาษาไทย</option>
                <option value="en">English</option>
              </Select>
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-line p-3">
            <input type="checkbox" name="aiEnabled" defaultChecked={project.ai_enabled} className="mt-1 size-4 accent-accent" />
            <span>
              <span className="block text-sm font-medium">{t("project.ai")}</span>
              <span className="block text-xs leading-relaxed text-muted">{t("project.aiHelp")}</span>
            </span>
          </label>
          {error && <p className="rounded-lg bg-err-soft px-3 py-2 text-sm text-err">{error}</p>}
          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-xs text-ok">✓ {t("common.saved")}</span>}
            <Button type="submit" disabled={pending}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="mb-3 font-semibold">{t("project.members")}</h3>
        <ul className="mb-4 divide-y divide-line">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {m.full_name ?? m.email} <span className="text-muted">· {m.email}</span>
              </span>
              {m.id !== project.created_by && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await removeMember(project.id, m.id);
                      router.refresh();
                    })
                  }
                >
                  {t("common.remove")}
                </Button>
              )}
            </li>
          ))}
        </ul>
        {others.length > 0 && (
          <div className="flex gap-2">
            <Select value={newMember} onChange={(e) => setNewMember(e.target.value)} aria-label={t("project.addMember")}>
              <option value="">{t("project.addMember")}</option>
              {others.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? p.email} ({p.email})
                </option>
              ))}
            </Select>
            <Button
              disabled={!newMember || pending}
              onClick={() =>
                start(async () => {
                  await addMember(project.id, newMember);
                  setNewMember("");
                  router.refresh();
                })
              }
            >
              {t("common.add")}
            </Button>
          </div>
        )}
      </Card>

      {canDelete && (
        <div className="flex justify-end">
          <Button
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (confirm(t("common.confirmDelete"))) start(() => deleteProject(project.id));
            }}
          >
            {t("project.deleteProject")}
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Select } from "@/components/ui";
import { useT } from "@/lib/i18n/client";

export function UseInProject({ frameworkKey, projects }: { frameworkKey: string; projects: { id: string; name: string }[] }) {
  const { t } = useT();
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  if (projects.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-56" aria-label={t("fw.pickProject")}>
        <option value="">{t("fw.pickProject")}</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
      <Button disabled={!projectId} onClick={() => router.push(`/projects/${projectId}/questions/new?framework=${frameworkKey}`)}>
        {t("fw.useInProject")}
      </Button>
    </div>
  );
}

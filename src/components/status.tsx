"use client";

import { useT } from "@/lib/i18n/client";
import type { AnalysisStatus, ProjectStatus } from "@/lib/types";
import { Badge } from "./ui";

const projectTone = { draft: "neutral", waiting_client: "warn", analyzing: "accent", summarized: "ok" } as const;
const analysisTone = { not_started: "neutral", in_progress: "accent", waiting_client: "warn", done: "ok" } as const;

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useT();
  return <Badge tone={projectTone[status]}>{t(`status.${status}`)}</Badge>;
}

export function AnalysisStatusBadge({ status }: { status: AnalysisStatus }) {
  const { t } = useT();
  return <Badge tone={analysisTone[status]}>{t(`astatus.${status}`)}</Badge>;
}

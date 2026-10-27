import { isFilled } from "@/frameworks/helpers";
import { PROFILE_BASICS, PROFILE_FIELDS } from "@/frameworks/profile";
import type { Data } from "@/frameworks/types";
import type { AnalysisStatus } from "./types";

export type StepKey = "profile" | "frameworks" | "client" | "summary" | "report";

export interface ProjectProgress {
  profile: { filled: number; total: number; done: boolean };
  /** firstOpen: the first framework, in page order, that isn't marked done. */
  frameworks: { total: number; done: number; firstOpen: string | null; complete: boolean };
  /** Client links are optional, so this step is never suggested as next. */
  client: { active: number; opened: number; submitted: number };
  summary: { done: boolean };
  report: { publishedAt: string | null; outdated: boolean; done: boolean };
  next: StepKey | null;
}

export interface ProgressInput {
  profile: Data;
  /** In the order the project page shows them. */
  analyses: { id: string; status: AnalysisStatus }[];
  links: { revoked_at: string | null; expires_at: string | null; opened_at: string | null; submitted_at: string | null }[];
  conclusion: string;
  summaryUpdatedAt: string | null;
  publications: { published_at: string; revoked_at: string | null }[];
  /** Latest change to any framework field (from the edit history). */
  lastFieldEditAt: string | null;
  now: number;
}

const later = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);

/** Where a project stands across profile → frameworks → client → summary → report. */
export function projectProgress(input: ProgressInput): ProjectProgress {
  const profile = {
    filled: PROFILE_FIELDS.filter((f) => isFilled(input.profile[f.key])).length,
    total: PROFILE_FIELDS.length,
    done: PROFILE_BASICS.every((key) => isFilled(input.profile[key])),
  };

  const doneCount = input.analyses.filter((a) => a.status === "done").length;
  const frameworks = {
    total: input.analyses.length,
    done: doneCount,
    firstOpen: input.analyses.find((a) => a.status !== "done")?.id ?? null,
    complete: input.analyses.length > 0 && doneCount === input.analyses.length,
  };

  const live = input.links.filter((l) => !l.revoked_at && (!l.expires_at || Date.parse(l.expires_at) > input.now));
  const client = {
    active: live.length,
    opened: input.links.filter((l) => l.opened_at).length,
    submitted: input.links.filter((l) => l.submitted_at).length,
  };

  const summary = { done: input.conclusion.trim().length > 0 };

  const publishedAt = input.publications
    .filter((p) => !p.revoked_at)
    .reduce<string | null>((latest, p) => later(latest, p.published_at), null);
  const lastEdit = later(input.summaryUpdatedAt, input.lastFieldEditAt);
  const outdated = !!publishedAt && !!lastEdit && lastEdit > publishedAt;
  const report = { publishedAt, outdated, done: !!publishedAt && !outdated };

  const order: [StepKey, boolean][] = [
    ["profile", profile.done],
    ["frameworks", frameworks.complete],
    ["summary", summary.done],
    ["report", report.done],
  ];
  return { profile, frameworks, client, summary, report, next: order.find(([, done]) => !done)?.[0] ?? null };
}

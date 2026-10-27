import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { projectProgress } from "./project-progress";
import type { Analysis, Client, Profile, Project, Question, Summary } from "./types";

/** The signed-in team member, or a redirect to sign-in / no-access. */
export const requireMember = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  const user = { id: data.claims.sub };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile?.active) redirect("/no-access");
  return { supabase, user, profile };
});

export const getProject = cache(async (id: string) => {
  const { supabase } = await requireMember();
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).maybeSingle<Project>();
  if (!project) notFound();
  const { data: client } = await supabase.from("clients").select("*").eq("id", project.client_id).single<Client>();
  return { project, client: client! };
});

export const getProjectContent = cache(async (projectId: string) => {
  const { supabase } = await requireMember();
  const [{ data: questions }, { data: analyses }] = await Promise.all([
    supabase.from("questions").select("*").eq("project_id", projectId).order("position").order("created_at"),
    supabase.from("analyses").select("*").eq("project_id", projectId).order("position").order("created_at"),
  ]);
  return { questions: (questions ?? []) as Question[], analyses: (analyses ?? []) as Analysis[] };
});

export const getSummary = cache(async (projectId: string) => {
  const { supabase } = await requireMember();
  const { data } = await supabase.from("summaries").select("*").eq("project_id", projectId).maybeSingle<Summary>();
  return data;
});

/** AI requests per member and model over the last `days` days. RLS shows admins everyone. */
export const getAiUsage = cache(async (days: number) => {
  const { supabase } = await requireMember();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await supabase.rpc("ai_usage_summary", { since });
  return data ?? [];
});

/** The project checklist: everything the overview page needs beyond questions and frameworks. */
export const getProjectProgress = cache(async (projectId: string) => {
  const { supabase } = await requireMember();
  const [{ project }, { questions, analyses }, summary, { data: links }, { data: publications }, { data: lastEdit }] = await Promise.all([
    getProject(projectId),
    getProjectContent(projectId),
    getSummary(projectId),
    supabase.from("client_links").select("revoked_at, expires_at, opened_at, submitted_at").eq("project_id", projectId),
    supabase.from("report_publications").select("published_at, revoked_at").eq("project_id", projectId),
    supabase
      .from("analysis_revisions")
      .select("updated_at")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const position = new Map(questions.map((q, i) => [q.id, i]));
  return projectProgress({
    profile: project.business_profile,
    analyses: [...analyses].sort((a, b) => position.get(a.question_id)! - position.get(b.question_id)!),
    links: links ?? [],
    conclusion: summary?.exec_summary.conclusion ?? "",
    summaryUpdatedAt: summary?.updated_at ?? null,
    publications: publications ?? [],
    lastFieldEditAt: lastEdit?.updated_at ?? null,
    now: Date.now(),
  });
});

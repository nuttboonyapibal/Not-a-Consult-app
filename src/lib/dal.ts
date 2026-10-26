import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Analysis, Client, Profile, Project, Question, Summary } from "./types";

/** The signed-in team member, or a redirect to sign-in / no-access. */
export const requireMember = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
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

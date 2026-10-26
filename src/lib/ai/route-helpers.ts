import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Analysis, Profile, Project, Question } from "@/lib/types";
import { AiError } from "./client";

async function requireAiMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AiError("Not signed in", 401);
  const { data: profile } = await supabase.from("profiles").select("active").eq("id", user.id).single<Pick<Profile, "active">>();
  if (!profile?.active) throw new AiError("No access", 403);
  return supabase;
}

/**
 * Loads the project as the signed-in member (RLS decides access) and refuses
 * when AI is turned off for it. Checked on every AI request, server side.
 */
export async function loadAiProject(projectId: string) {
  const supabase = await requireAiMember();
  const { data: project } = await supabase.from("projects").select("*").eq("id", z.uuid().parse(projectId)).maybeSingle<Project>();
  if (!project) throw new AiError("Project not found", 404);
  if (!project.ai_enabled) throw new AiError("AI is turned off for this project", 403);
  return { supabase, project };
}

export async function loadAiAnalysis(analysisId: string) {
  const supabase = await requireAiMember();
  const { data: analysis } = await supabase.from("analyses").select("*").eq("id", z.uuid().parse(analysisId)).maybeSingle<Analysis>();
  if (!analysis) throw new AiError("Analysis not found", 404);
  const { project } = await loadAiProject(analysis.project_id);
  const { data: question } = await supabase.from("questions").select("text").eq("id", analysis.question_id).single<Pick<Question, "text">>();
  return { supabase, project, analysis, question: question?.text ?? "" };
}

export function aiErrorResponse(e: unknown) {
  if (e instanceof AiError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  console.error(e);
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}

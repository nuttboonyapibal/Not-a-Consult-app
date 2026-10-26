import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import type { Analysis, Profile, Project, Question } from "@/lib/types";
import { AiError, generate, type AiUsage, type GenerateArgs } from "./client";

async function requireAiMember() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new AiError("Not signed in", 401);
  const { data: profile } = await supabase.from("profiles").select("active").eq("id", data.claims.sub).single<Pick<Profile, "active">>();
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

/**
 * One AI call, recorded in ai_requests with the model and token counts.
 * A failed log write is reported but never fails the AI request itself.
 */
export async function generateLogged<S extends z.ZodType>(
  supabase: SupabaseClient<Database>,
  log: { projectId: string; kind: "recommend" | "assist" | "review" | "summary" },
  args: GenerateArgs<S>,
): Promise<z.infer<S>> {
  let usage: AiUsage | undefined;
  let error: string | null = null;
  try {
    const result = await generate(args);
    usage = result.usage;
    return result.output;
  } catch (e) {
    if (e instanceof AiError) usage = e.usage;
    error = e instanceof Error ? e.message : String(e);
    throw e;
  } finally {
    try {
      const { error: logError } = await supabase.from("ai_requests").insert({
        project_id: log.projectId,
        kind: log.kind,
        model: usage?.model ?? args.model,
        input_tokens: usage?.input_tokens ?? 0,
        output_tokens: usage?.output_tokens ?? 0,
        cache_read_tokens: usage?.cache_read_tokens ?? 0,
        ok: error === null,
        error,
      });
      if (logError) console.error("Could not log AI request:", logError.message);
    } catch (e) {
      console.error("Could not log AI request:", e);
    }
  }
}

export function aiErrorResponse(e: unknown) {
  if (e instanceof AiError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  console.error(e);
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}

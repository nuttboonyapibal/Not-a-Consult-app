"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFramework } from "@/frameworks/registry";
import { requireMember } from "@/lib/dal";
import { toJson } from "@/lib/types";
import { fail, ok, type ActionResult } from "./result";

const QuestionInput = z.object({
  projectId: z.uuid(),
  text: z.string().trim().min(1).max(500),
  category: z.string().max(50).nullable(),
  frameworks: z
    .array(z.string())
    .min(1)
    .max(3)
    .refine((keys) => keys.every((k) => getFramework(k)), "Unknown framework"),
});

export async function createQuestion(input: z.input<typeof QuestionInput>): Promise<ActionResult<{ analysisId: string }>> {
  try {
    const { supabase } = await requireMember();
    const q = QuestionInput.parse(input);
    const { count } = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("project_id", q.projectId);
    const { data: question, error } = await supabase
      .from("questions")
      .insert({ project_id: q.projectId, text: q.text, category: q.category, position: count ?? 0 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const { data: analyses, error: aError } = await supabase
      .from("analyses")
      .insert(q.frameworks.map((key, i) => ({ project_id: q.projectId, question_id: question.id, framework_key: key, position: i })))
      .select("id, position")
      .order("position");
    if (aError) throw new Error(aError.message);
    revalidatePath(`/projects/${q.projectId}`);
    return ok({ analysisId: analyses[0].id });
  } catch (e) {
    return fail(e);
  }
}

export async function addAnalysis(projectId: string, questionId: string, frameworkKey: string): Promise<ActionResult<{ analysisId: string }>> {
  try {
    const { supabase } = await requireMember();
    if (!getFramework(frameworkKey)) throw new Error("Unknown framework");
    const { count } = await supabase.from("analyses").select("id", { count: "exact", head: true }).eq("question_id", questionId);
    const { data, error } = await supabase
      .from("analyses")
      .insert({ project_id: projectId, question_id: questionId, framework_key: frameworkKey, position: count ?? 0 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath(`/projects/${projectId}`);
    return ok({ analysisId: data.id });
  } catch (e) {
    return fail(e);
  }
}

export async function deleteQuestion(projectId: string, questionId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireMember();
    const { error } = await supabase.from("questions").delete().eq("id", questionId);
    if (error) throw new Error(error.message);
    revalidatePath(`/projects/${projectId}`);
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}

export async function deleteAnalysis(projectId: string, analysisId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireMember();
    const { error } = await supabase.from("analyses").delete().eq("id", analysisId);
    if (error) throw new Error(error.message);
    revalidatePath(`/projects/${projectId}`);
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}

/** Saves changed fields only; the database merges them key by key. */
export async function patchAnalysis(analysisId: string, patch: Record<string, unknown>): Promise<ActionResult> {
  try {
    const { supabase } = await requireMember();
    const { error } = await supabase.rpc("patch_analysis", { aid: z.uuid().parse(analysisId), patch: toJson(patch) });
    if (error) throw new Error(error.message);
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}

export async function setAnalysisStatus(
  projectId: string,
  analysisId: string,
  status: "not_started" | "in_progress" | "waiting_client" | "done",
): Promise<ActionResult> {
  try {
    const { supabase } = await requireMember();
    const { error } = await supabase.from("analyses").update({ status }).eq("id", analysisId);
    if (error) throw new Error(error.message);
    revalidatePath(`/projects/${projectId}`, "layout");
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}

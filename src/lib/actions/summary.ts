"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getProject, getProjectContent, getSummary, requireMember } from "@/lib/dal";
import { toJson, type ReportSnapshot } from "@/lib/types";
import { fail, ok, type ActionResult } from "./result";

const SummaryInput = z.object({
  exec_summary: z.object({
    conclusion: z.string().max(4000),
    reasons: z.array(z.object({ title: z.string().max(1000), detail: z.string().max(4000) })).max(5),
  }),
  decisions: z
    .array(z.object({ id: z.string(), kind: z.enum(["decision", "hypothesis"]), text: z.string().max(2000), test: z.string().max(2000) }))
    .max(30),
  action_plan: z.object({
    objective: z.string().max(1000),
    period: z.string().max(200),
    keyResults: z.array(z.object({ id: z.string(), text: z.string().max(1000), target: z.string().max(200), owner: z.string().max(200) })).max(10),
    tasks: z.array(z.object({ id: z.string(), task: z.string().max(1000), owner: z.string().max(200), due: z.string().max(100) })).max(50),
  }),
});

export async function saveSummary(
  projectId: string,
  summary: z.input<typeof SummaryInput>,
  source: "ai" | "template" | "manual",
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireMember();
    const body = SummaryInput.parse(summary);
    const { error } = await supabase.from("summaries").upsert({
      project_id: projectId,
      ...body,
      source,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    revalidatePath(`/projects/${projectId}`, "layout");
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}

export async function publishReport(projectId: string): Promise<ActionResult<{ token: string }>> {
  try {
    const { supabase, user } = await requireMember();
    const { project, client } = await getProject(projectId);
    const { questions, analyses } = await getProjectContent(projectId);
    const summary = await getSummary(projectId);
    const snapshot: ReportSnapshot = {
      projectName: project.name,
      clientName: client.name,
      stage: project.stage,
      summary: summary ? { exec_summary: summary.exec_summary, decisions: summary.decisions, action_plan: summary.action_plan } : null,
      questions: questions.map((q) => ({
        text: q.text,
        analyses: analyses.filter((a) => a.question_id === q.id).map((a) => ({ framework_key: a.framework_key, data: a.data })),
      })),
    };
    const token = randomBytes(24).toString("base64url");
    const { error } = await supabase.from("report_publications").insert({
      project_id: projectId,
      token,
      snapshot: toJson(snapshot),
      lang: project.report_lang,
      published_by: user.id,
    });
    if (error) throw new Error(error.message);
    await supabase.from("projects").update({ status: "summarized", updated_at: new Date().toISOString() }).eq("id", projectId);
    revalidatePath(`/projects/${projectId}`, "layout");
    return ok({ token });
  } catch (e) {
    return fail(e);
  }
}

export async function revokeReport(projectId: string, reportId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireMember();
    const { error } = await supabase.from("report_publications").update({ revoked_at: new Date().toISOString() }).eq("id", reportId);
    if (error) throw new Error(error.message);
    revalidatePath(`/projects/${projectId}/report`);
    return ok(undefined);
  } catch (e) {
    return fail(e);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getFramework, runChecks } from "@/frameworks/registry";
import { AiError, MODELS } from "@/lib/ai/client";
import { describeAnalysis, describeProfile, languageLine, SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { aiErrorResponse, generateLogged, loadAiProject } from "@/lib/ai/route-helpers";
import type { Analysis, Question } from "@/lib/types";

export const maxDuration = 300;

const Body = z.object({ projectId: z.uuid() });

const Output = z.object({
  exec_summary: z.object({
    conclusion: z.string(),
    reasons: z.array(z.object({ title: z.string(), detail: z.string() })),
  }),
  decisions: z.array(z.object({ kind: z.enum(["decision", "hypothesis"]), text: z.string(), test: z.string() })),
  action_plan: z.object({
    objective: z.string(),
    period: z.string(),
    keyResults: z.array(z.object({ text: z.string(), target: z.string(), owner: z.string() })),
    tasks: z.array(z.object({ task: z.string(), owner: z.string(), due: z.string() })),
  }),
});

const rid = () => Math.random().toString(36).slice(2, 10);

export async function POST(request: Request) {
  try {
    const body = Body.parse(await request.json());
    const { supabase, project } = await loadAiProject(body.projectId);
    const lang = project.report_lang;
    const [{ data: questions }, { data: analyses }] = await Promise.all([
      supabase.from("questions").select("*").eq("project_id", project.id).order("position"),
      supabase.from("analyses").select("*").eq("project_id", project.id).order("position"),
    ]);
    if (!analyses?.length) throw new AiError("Add at least one framework before summarizing", 400);

    const work = (questions as Question[])
      .map((q) => {
        const items = (analyses as Analysis[]).filter((a) => a.question_id === q.id);
        return (
          `## Question: ${q.text}\n` +
          items
            .map((a) => {
              const def = getFramework(a.framework_key);
              if (!def) return "";
              const issues = runChecks(def, a.data).filter((c) => c.level !== "ok");
              return (
                `### ${def.name.en}\n${describeAnalysis(def, a.data, lang)}\n` +
                (issues.length ? `Open issues from automatic checks:\n${issues.map((c) => `- ${c.message.en}`).join("\n")}\n` : "")
              );
            })
            .join("\n")
        );
      })
      .join("\n\n");

    const result = await generateLogged(supabase, { projectId: project.id, kind: "summary" }, {
      model: MODELS.summary,
      system: SYSTEM_PROMPT,
      schema: Output,
      effort: "high",
      prompt: `Write the project summary the consulting team will show the client.

Project: ${project.name}
Business stage: ${project.stage}

Business profile:
${describeProfile(project.business_profile, lang)}

All analysis work:
${work}

Write three parts:
1. exec_summary, following the Pyramid Principle: conclusion is the answer first, in one or two sentences; then exactly 3 reasons, each with a short title (the claim) and detail (the supporting evidence from the work above, with the numbers that exist).
2. decisions: 3–7 items. kind "decision" when the evidence is strong enough to act; kind "hypothesis" when it still needs testing. For hypotheses, test says how to test it cheaply and the pass/fail bar set in advance; for decisions, test may be empty.
3. action_plan: one qualitative objective with a period (e.g. next quarter), 2–4 measurable key results (target as a number with unit), and the concrete tasks that follow from the decisions. Use owners only if the work names them, otherwise leave owner empty.
Where the work is thin or relies on guesses, say so honestly and turn it into a hypothesis rather than a conclusion. Never invent numbers.
${languageLine(lang)}`,
    });

    return NextResponse.json({
      exec_summary: { conclusion: result.exec_summary.conclusion, reasons: result.exec_summary.reasons.slice(0, 3) },
      decisions: result.decisions.map((d) => ({ id: rid(), ...d })),
      action_plan: {
        objective: result.action_plan.objective,
        period: result.action_plan.period,
        keyResults: result.action_plan.keyResults.map((k) => ({ id: rid(), ...k })),
        tasks: result.action_plan.tasks.map((t) => ({ id: rid(), ...t })),
      },
    });
  } catch (e) {
    return aiErrorResponse(e);
  }
}

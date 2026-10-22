import { NextResponse } from "next/server";
import { z } from "zod";
import { fieldsOf, getFramework, runChecks } from "@/frameworks/registry";
import { AiError, generate, MODELS } from "@/lib/ai/client";
import { describeAnalysis, describeFramework, describeProfile, languageLine, SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { aiErrorResponse, loadAiAnalysis } from "@/lib/ai/route-helpers";

export const maxDuration = 60;

const Body = z.object({
  analysisId: z.uuid(),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  try {
    const body = Body.parse(await request.json());
    const { project, analysis, question } = await loadAiAnalysis(body.analysisId);
    const def = getFramework(analysis.framework_key);
    if (!def) throw new AiError("Unknown framework", 400);
    const lang = project.report_lang;
    const data = { ...analysis.data, ...body.data };
    const keys = fieldsOf(def).map((f) => f.key) as [string, ...string[]];
    const ruleFindings = runChecks(def, data).filter((c) => c.level !== "ok");

    const Output = z.object({
      summary: z.string(),
      items: z.array(
        z.object({
          level: z.enum(["ok", "warn", "error"]),
          field: z.enum(keys).nullable(),
          message: z.string(),
        }),
      ),
    });

    const result = await generate({
      model: MODELS.assist,
      system: SYSTEM_PROMPT,
      schema: Output,
      prompt: `Review this filled framework like a senior consultant before it goes to the client.

Framework:
${describeFramework(def)}

Business question being answered: ${question}
Business stage: ${project.stage}

Business profile:
${describeProfile(project.business_profile, lang)}

Filled framework:
${describeAnalysis(def, data, lang)}

Automatic checks already shown to the team (don't repeat them):
${ruleFindings.map((c) => `- ${c.message.en}`).join("\n") || "(none)"}

Look for: the framework's common trap; answers that look like guesses rather than real data; parts that contradict each other; whether it actually answers the business question; whether it ends with a decision or a testable hypothesis.
Return at most 6 items, most important first. Each item: level (error = must fix, warn = should improve, ok = notably good), the field key it is about (or null), and one or two concrete sentences on what to change.
summary: one sentence on how ready this is to show the client.
${languageLine(lang)}`,
    });

    return NextResponse.json({ summary: result.summary, items: result.items.slice(0, 6) });
  } catch (e) {
    return aiErrorResponse(e);
  }
}

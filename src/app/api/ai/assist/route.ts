import { NextResponse } from "next/server";
import { z } from "zod";
import { getFramework, stepsOf } from "@/frameworks/registry";
import { AiError, generate, MODELS } from "@/lib/ai/client";
import { describeAnalysis, describeField, describeFramework, describeProfile, languageLine, SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { aiErrorResponse, loadAiAnalysis } from "@/lib/ai/route-helpers";
import { normalizeValues, valuesSchema } from "@/lib/ai/schemas";

export const maxDuration = 60;

const Body = z.object({
  analysisId: z.uuid(),
  stepId: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  try {
    const body = Body.parse(await request.json());
    const { project, analysis, question } = await loadAiAnalysis(body.analysisId);
    const def = getFramework(analysis.framework_key);
    const step = def && stepsOf(def).find((s) => s.id === body.stepId);
    if (!def || !step) throw new AiError("Unknown step", 400);
    const lang = project.report_lang;
    // The editor's unsaved values are newer than the database copy.
    const data = { ...analysis.data, ...body.data };

    const Output = z.object({ values: valuesSchema(step.fields), notes: z.string() });
    const result = await generate({
      model: MODELS.assist,
      system: SYSTEM_PROMPT,
      schema: Output,
      prompt: `Draft values for one step of a framework.

Framework:
${describeFramework(def)}

Business question being answered: ${question}
Business stage: ${project.stage}

Business profile:
${describeProfile(project.business_profile, lang)}

Everything filled in this framework so far:
${describeAnalysis(def, data, lang)}

The step to draft: ${step.title.en}
${step.intro ? `Guidance: ${step.intro.en}` : ""}
Fields:
${step.fields.map((f) => describeField(f, lang)).join("\n")}

Return a value for every field key above. Build on what is already filled and keep it consistent. Avoid the framework's common trap.
Do not invent numbers or research findings: leave a field empty when the context doesn't support it.
In notes (2–4 sentences), say what you assumed and what real data the team should collect to confirm or complete this step.
${languageLine(lang)}`,
    });

    return NextResponse.json({ values: normalizeValues(step.fields, result.values), notes: result.notes });
  } catch (e) {
    return aiErrorResponse(e);
  }
}

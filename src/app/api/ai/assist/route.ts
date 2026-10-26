import { NextResponse } from "next/server";
import { z } from "zod";
import { fieldsOf, getFramework, stepsOf } from "@/frameworks/registry";
import { AiError, MODELS } from "@/lib/ai/client";
import { describeAnalysis, describeField, describeFramework, describeProfile, languageLine, SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { aiErrorResponse, generateLogged, loadAiAnalysis } from "@/lib/ai/route-helpers";
import { normalizeValues, valuesSchema } from "@/lib/ai/schemas";

export const maxDuration = 120;

// Either one step of the form, or any set of fields on the canvas
// (one selected field, or every empty one).
const Body = z
  .object({
    analysisId: z.uuid(),
    stepId: z.string().optional(),
    fieldKeys: z.array(z.string()).min(1).max(60).optional(),
    data: z.record(z.string(), z.unknown()),
  })
  .refine((b) => b.stepId || b.fieldKeys, "stepId or fieldKeys is required");

export async function POST(request: Request) {
  try {
    const body = Body.parse(await request.json());
    const { supabase, project, analysis, question } = await loadAiAnalysis(body.analysisId);
    const def = getFramework(analysis.framework_key);
    if (!def) throw new AiError("Unknown framework", 400);

    const step = body.stepId ? stepsOf(def).find((s) => s.id === body.stepId) : undefined;
    const fields = body.fieldKeys ? fieldsOf(def).filter((f) => body.fieldKeys!.includes(f.key)) : (step?.fields ?? []);
    if (fields.length === 0) throw new AiError("Unknown fields", 400);
    const lang = project.report_lang;
    // The editor's unsaved values are newer than the database copy.
    const data = { ...analysis.data, ...body.data };

    const Output = z.object({ values: valuesSchema(fields), notes: z.string() });
    const result = await generateLogged(supabase, { projectId: project.id, kind: "assist" }, {
      model: MODELS.assist,
      system: SYSTEM_PROMPT,
      schema: Output,
      prompt: `Draft values for part of a framework.

Framework:
${describeFramework(def)}

Business question being answered: ${question}
Business stage: ${project.stage}

Business profile:
${describeProfile(project.business_profile, lang)}

Everything filled in this framework so far:
${describeAnalysis(def, data, lang)}

${step ? `The step to draft: ${step.title.en}\n${step.intro ? `Guidance: ${step.intro.en}\n` : ""}` : ""}Fields to draft:
${fields.map((f) => describeField(f, lang)).join("\n")}

Return a value for every field key above. Build on what is already filled and keep it consistent. Avoid the framework's common trap.
Do not invent numbers or research findings: leave a field empty when the context doesn't support it.
In notes (2–4 sentences), say what you assumed and what real data the team should collect to confirm or complete these fields.
${languageLine(lang)}`,
    });

    return NextResponse.json({ values: normalizeValues(fields, result.values), notes: result.notes });
  } catch (e) {
    return aiErrorResponse(e);
  }
}

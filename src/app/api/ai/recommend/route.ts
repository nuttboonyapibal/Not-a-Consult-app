import { NextResponse } from "next/server";
import { z } from "zod";
import { CATALOG, CATEGORIES } from "@/frameworks/catalog";
import { generate, MODELS } from "@/lib/ai/client";
import { describeProfile, languageLine, SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { aiErrorResponse, loadAiProject } from "@/lib/ai/route-helpers";

export const maxDuration = 60;

const Body = z.object({
  projectId: z.uuid(),
  question: z.string().trim().min(1).max(500),
  category: z.string().nullable().optional(),
});

const KEYS = CATALOG.map((f) => f.key) as [string, ...string[]];

const Output = z.object({
  refined_question: z.string(),
  picks: z.array(z.object({ key: z.enum(KEYS), reason: z.string() })),
});

export async function POST(request: Request) {
  try {
    const body = Body.parse(await request.json());
    const { project } = await loadAiProject(body.projectId);
    const lang = project.report_lang;
    const category = CATEGORIES.find((c) => c.key === body.category);

    const result = await generate({
      model: MODELS.assist,
      system: SYSTEM_PROMPT,
      schema: Output,
      prompt: `Recommend frameworks for this business question.

Question: ${body.question}
Business stage: ${project.stage}
${category ? `The consultant thinks it belongs to: ${category.name.en} (${category.question.en})` : ""}

Business profile:
${describeProfile(project.business_profile, lang)}

Pick the 1–3 frameworks from the catalog that answer this question best, best first. Prefer depth over breadth: usually 1–2.
For each, give one short reason tied to this question and stage, and name the trap to watch for in this situation.
Also return refined_question: the same question rewritten to be specific and answerable (who, what, time frame), or the original if it is already clear.
${languageLine(lang)}`,
    });

    const picks = result.picks.filter((p, i, all) => all.findIndex((x) => x.key === p.key) === i).slice(0, 3);
    return NextResponse.json({ refined: result.refined_question, picks });
  } catch (e) {
    return aiErrorResponse(e);
  }
}

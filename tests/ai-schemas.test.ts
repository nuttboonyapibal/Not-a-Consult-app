import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { FRAMEWORKS, stepsOf } from "@/frameworks/registry";
import { describeAnalysis, SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { normalizeValues, valuesSchema } from "@/lib/ai/schemas";

describe("AI output schemas", () => {
  it("builds a structured-output schema for every step of every framework", () => {
    for (const def of FRAMEWORKS) {
      for (const step of stepsOf(def)) {
        const schema = z.object({ values: valuesSchema(step.fields), notes: z.string() });
        expect(() => betaZodOutputFormat(schema), `${def.key}/${step.id}`).not.toThrow();
      }
    }
  });

  it("adds ids to AI tables and trees", () => {
    const issueTree = FRAMEWORKS.find((f) => f.key === "issue-tree")!;
    const fields = stepsOf(issueTree).flatMap((s) => s.fields);
    const out = normalizeValues(fields, {
      tree: { text: "Sales down", children: [{ text: "Fewer bills", children: [{ text: "New", children: [] }] }] },
    });
    const tree = out.tree as { id: string; children: { id: string; children: { id: string }[] }[] };
    expect(tree.id).toBe("root");
    expect(tree.children[0].id).toBeTruthy();
    expect(tree.children[0].children[0].id).toBeTruthy();
  });

  it("keeps the cached system prompt stable and complete", () => {
    expect(SYSTEM_PROMPT).toContain("unit-economics");
    expect(SYSTEM_PROMPT).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
    for (const def of FRAMEWORKS) expect(SYSTEM_PROMPT).toContain(def.key);
  });

  it("describes filled data with field keys for the model", () => {
    const ue = FRAMEWORKS.find((f) => f.key === "unit-economics")!;
    const text = describeAnalysis(ue, ue.example!, "th");
    expect(text).toContain("[arpu]");
    expect(text).toContain("LINE Ads");
  });
});

import "server-only";
import { CATALOG, CATEGORIES, STAGES } from "@/frameworks/catalog";
import { isFilled } from "@/frameworks/helpers";
import { PROFILE_FIELDS } from "@/frameworks/profile";
import { stepsOf } from "@/frameworks/registry";
import type { Data, FieldDef, FrameworkDef, Lang, TableRow, TreeNode } from "@/frameworks/types";

const LANGUAGE = { th: "Thai", en: "English" };

// Built once from static content so the cached prefix never changes.
export const SYSTEM_PROMPT = `You support a business consulting team that analyzes client businesses with frameworks from their cheat sheet.

How the team works (from the cheat sheet):
1. Name the question that needs answering now.
2. Pick 1–2 frameworks from the category that matches the question.
3. Fill the framework with real data (numbers, customer conversations), not the team's beliefs.
4. Finish with a decision or a hypothesis to test.
A framework helps ask questions; it doesn't give the answer. The most common mistake is filling every box and feeling the thinking is done without talking to customers or checking real numbers. A few frameworks used deeply beat many used lightly.

Rules for everything you write:
- Use only facts present in the context you are given. Never invent numbers, names, survey results or interview findings. When a field needs data that isn't in the context, leave it empty (empty string, empty list or null) and say in your notes exactly what to collect.
- Label your inferences as assumptions to test rather than stating them as facts.
- Write plainly and concretely, in the language requested. Keep framework names and standard terms (CAC, LTV, OKR, MECE…) in English.
- Keep each value short enough to fit on a canvas or slide: one idea per list item.

Business stages:
${STAGES.map((s) => `- ${s.key}: ${s.name.en} — "${s.question.en}"`).join("\n")}

Framework catalog (key | category | name | question it answers | how to use | common trap):
${CATEGORIES.map(
  (c) =>
    `\n## ${c.name.en} — ${c.question.en}\n` +
    CATALOG.filter((f) => f.category === c.key)
      .map((f) => `- ${f.key} | ${f.name.en} | ${f.question.en} | ${f.howTo.en} | Trap: ${f.trap.en}`)
      .join("\n"),
).join("\n")}`;

export const languageLine = (lang: Lang) => `Write all text in ${LANGUAGE[lang]}.`;

function formatValue(field: FieldDef, value: unknown, lang: Lang): string {
  if (!isFilled(value)) return "(empty)";
  switch (field.type) {
    case "list":
      return (value as string[]).map((v) => `\n    - ${v}`).join("");
    case "table":
      return (value as TableRow[])
        .map((r) => `\n    - ${(field.columns ?? []).map((c) => `${c.label[lang]}: ${r[c.key] ?? ""}`).join("; ")}`)
        .join("");
    case "tree": {
      const lines: string[] = [];
      const walk = (n: TreeNode, d: number) => {
        lines.push(`\n    ${"  ".repeat(d)}- ${n.text}`);
        n.children.forEach((c) => walk(c, d + 1));
      };
      walk(value as TreeNode, 0);
      return lines.join("");
    }
    default:
      return String(value);
  }
}

export function describeProfile(profile: Data, lang: Lang) {
  const lines = PROFILE_FIELDS.filter((f) => isFilled(profile[f.key])).map(
    (f) => `- ${f.label[lang]}: ${formatValue(f, profile[f.key], lang)}`,
  );
  return lines.length ? lines.join("\n") : "(not filled yet)";
}

/** The framework's fields and current values, grouped by step. */
export function describeAnalysis(def: FrameworkDef, data: Data, lang: Lang) {
  return stepsOf(def)
    .map(
      (step) =>
        `### ${step.title[lang]}\n` +
        step.fields.map((f) => `- [${f.key}] ${f.label[lang]}: ${formatValue(f, data[f.key], lang)}`).join("\n"),
    )
    .join("\n\n");
}

export function describeFramework(def: FrameworkDef) {
  return `${def.name.en} (${def.key})\nQuestion it answers: ${def.question.en}\nHow to use: ${def.howTo.en}\nCommon trap: ${def.trap.en}`;
}

export function describeField(field: FieldDef, lang: Lang) {
  const parts = [`- [${field.key}] ${field.label[lang]} (type: ${field.type}${field.unit ? `, unit: ${field.unit[lang]}` : ""})`];
  if (field.hint) parts.push(`  hint: ${field.hint[lang]}`);
  if (field.columns) parts.push(`  columns: ${field.columns.map((c) => `${c.key} (${c.type})`).join(", ")}`);
  if (field.options) parts.push(`  options: ${field.options.map((o) => o.value).join(", ")}`);
  return parts.join("\n");
}

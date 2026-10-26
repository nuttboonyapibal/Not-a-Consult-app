import { cellNum, cellStr, CONCLUSION, NEXT, rows, str } from "./helpers";
import { getFramework, runChecks } from "./registry";
import type { Data, Lang } from "./types";

export interface ExecSummary {
  conclusion: string;
  reasons: { title: string; detail: string }[];
}

export interface DecisionItem {
  id: string;
  kind: "decision" | "hypothesis";
  text: string;
  /** For hypotheses: how to test and the pass bar. */
  test: string;
}

export interface ActionPlan {
  objective: string;
  period: string;
  keyResults: { id: string; text: string; target: string; owner: string }[];
  tasks: { id: string; task: string; owner: string; due: string }[];
}

export interface ProjectSummary {
  exec_summary: ExecSummary;
  decisions: DecisionItem[];
  action_plan: ActionPlan;
}

export interface SummaryInput {
  question: string;
  frameworkKey: string;
  data: Data;
}

const HYPOTHESIS_WORDS = ["ทดสอบ", "สมมติฐาน", "ลอง", "test", "hypothes", "experiment", "validate", "ถ้า", "if "];

let counter = 0;
const id = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Builds a first draft of the project summary without AI. */
export function templateSummary(items: SummaryInput[], lang: Lang): ProjectSummary {
  const reasons = items
    .map((item) => {
      const def = getFramework(item.frameworkKey);
      if (!def) return null;
      const conclusion = str(item.data, CONCLUSION);
      const bullets = def.summarize?.(item.data, lang) ?? [];
      if (!conclusion && bullets.length === 0) return null;
      return {
        title: conclusion || `${def.name[lang]}: ${item.question}`,
        detail: [`${def.name[lang]} · ${item.question}`, ...bullets].join("\n"),
      };
    })
    .filter((r): r is ExecSummary["reasons"][number] => r !== null)
    .slice(0, 3);

  const decisions: DecisionItem[] = [];
  for (const item of items) {
    const next = str(item.data, NEXT);
    if (next) {
      const lower = next.toLowerCase();
      decisions.push({
        id: id(),
        kind: HYPOTHESIS_WORDS.some((w) => lower.includes(w)) ? "hypothesis" : "decision",
        text: next,
        test: "",
      });
    }
  }
  // Warnings become hypotheses to confirm with real data.
  for (const item of items) {
    const def = getFramework(item.frameworkKey);
    if (!def) continue;
    for (const check of runChecks(def, item.data)) {
      if (check.level === "error" && decisions.length < 8) {
        decisions.push({
          id: id(),
          kind: "hypothesis",
          text: `${def.name[lang]}: ${check.message[lang]}`,
          test: lang === "th" ? "ยืนยันด้วยข้อมูลจริงก่อนตัดสินใจ" : "Confirm with real data before deciding",
        });
      }
    }
  }

  const okr = items.find((i) => i.frameworkKey === "okrs");
  const action_plan: ActionPlan = {
    objective: okr ? str(okr.data, "objective") : "",
    period: okr ? str(okr.data, "period") : "",
    keyResults: okr
      ? rows(okr.data, "keyResults")
          .filter((r) => cellStr(r, "text"))
          .map((r) => ({
            id: id(),
            text: cellStr(r, "text"),
            target: cellNum(r, "target")?.toString() ?? "",
            owner: cellStr(r, "owner"),
          }))
      : [],
    tasks: decisions
      .filter((d) => d.kind === "decision")
      .map((d) => ({ id: id(), task: d.text, owner: "", due: "" })),
  };

  return {
    exec_summary: { conclusion: "", reasons },
    decisions,
    action_plan,
  };
}

export const emptySummary = (): ProjectSummary => ({
  exec_summary: { conclusion: "", reasons: [] },
  decisions: [],
  action_plan: { objective: "", period: "", keyResults: [], tasks: [] },
});

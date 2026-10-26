import { CATALOG, CATEGORIES } from "./catalog";
import { aarrr } from "./defs/aarrr";
import { ansoff } from "./defs/ansoff";
import { balancedScorecard } from "./defs/balanced-scorecard";
import { bcg } from "./defs/bcg";
import { blueOcean } from "./defs/blue-ocean";
import { fiveForces } from "./defs/five-forces";
import { leanCanvas } from "./defs/lean-canvas";
import { marketingMix } from "./defs/marketing-mix";
import { mckinsey7s } from "./defs/mckinsey-7s";
import { pestel } from "./defs/pestel";
import { sevenPowers } from "./defs/seven-powers";
import { swotTows } from "./defs/swot-tows";
import { vpc } from "./defs/vpc";
import { bmc } from "./defs/bmc";
import { issueTree } from "./defs/issue-tree";
import { jtbd } from "./defs/jtbd";
import { okrs } from "./defs/okrs";
import { playingToWin } from "./defs/playing-to-win";
import type { StructuredDef } from "./defs/types";
import { unitEconomics } from "./defs/unit-economics";
import { closingChecks, closingStep, isFilled, t } from "./helpers";
import type { CategoryKey, Check, Data, FieldDef, FrameworkDef, FrameworkMeta, StepDef } from "./types";

const STRUCTURED: StructuredDef[] = [
  jtbd,
  bmc,
  unitEconomics,
  playingToWin,
  aarrr,
  okrs,
  issueTree,
  leanCanvas,
  vpc,
  swotTows,
  blueOcean,
  ansoff,
  bcg,
  pestel,
  fiveForces,
  mckinsey7s,
  marketingMix,
  balancedScorecard,
  sevenPowers,
];

// Frameworks without a structured form yet get one general step built from the
// cheat sheet's how-to. Phase 2 replaces these with structured forms.
function genericSteps(meta: FrameworkMeta): StepDef[] {
  return [
    {
      id: "analysis",
      title: t("วิเคราะห์", "Analysis"),
      intro: meta.howTo,
      fields: [
        {
          key: "analysis",
          type: "textarea",
          label: t("ผลการวิเคราะห์", "Analysis"),
          hint: meta.howTo,
        },
        {
          key: "keyPoints",
          type: "list",
          label: t("ประเด็นสำคัญ", "Key points"),
          hint: t("เลือกเฉพาะประเด็นที่กระทบจริง 2–5 ข้อ", "Only the 2–5 points that really matter."),
        },
      ],
    },
  ];
}

function genericChecks(data: Data): Check[] {
  if (isFilled(data.analysis) || isFilled(data.keyPoints)) return [];
  return [
    {
      id: "empty",
      level: "warn",
      field: "analysis",
      message: t("ยังไม่ได้กรอกผลการวิเคราะห์", "The analysis is still empty."),
    },
  ];
}

export const FRAMEWORKS: FrameworkDef[] = CATALOG.map((meta) => {
  const def = STRUCTURED.find((s) => s.key === meta.key);
  if (def) return { ...meta, ...def, structured: true };
  return { ...meta, view: "generic", structured: false, steps: genericSteps(meta), checks: genericChecks };
});

const BY_KEY = new Map(FRAMEWORKS.map((f) => [f.key, f]));

export function getFramework(key: string): FrameworkDef | undefined {
  return BY_KEY.get(key);
}

export function frameworksIn(category: CategoryKey) {
  return FRAMEWORKS.filter((f) => f.category === category);
}

export function categoryOf(key: CategoryKey) {
  return CATEGORIES.find((c) => c.key === key)!;
}

/** The framework's own steps plus the shared closing step. */
export function stepsOf(def: FrameworkDef): StepDef[] {
  return [...def.steps, closingStep];
}

export function fieldsOf(def: FrameworkDef): FieldDef[] {
  return stepsOf(def).flatMap((s) => s.fields);
}

export function runChecks(def: FrameworkDef, data: Data): Check[] {
  return [...(def.checks?.(data) ?? []), ...closingChecks(data)];
}

/** Share of fields that have a value, from 0 to 1. */
export function completion(def: FrameworkDef, data: Data): number {
  const fields = fieldsOf(def);
  if (fields.length === 0) return 0;
  return fields.filter((f) => isFilled(data[f.key])).length / fields.length;
}

/** Field keys in the suggested filling order (the step order, closing step last). */
export function fieldOrder(def: FrameworkDef): string[] {
  return fieldsOf(def).map((f) => f.key);
}

export function fieldDef(def: FrameworkDef, key: string): FieldDef | undefined {
  return fieldsOf(def).find((f) => f.key === key);
}

/** The next empty field after `after` in the suggested order, wrapping around. */
export function nextEmptyField(def: FrameworkDef, data: Data, after?: string | null): string | null {
  const order = fieldOrder(def);
  const start = after ? order.indexOf(after) + 1 : 0;
  for (let i = 0; i < order.length; i++) {
    const key = order[(start + i) % order.length];
    if (key !== after && !isFilled(data[key])) return key;
  }
  return null;
}

export function stepCompletion(step: StepDef, data: Data): number {
  if (step.fields.length === 0) return 0;
  return step.fields.filter((f) => isFilled(data[f.key])).length / step.fields.length;
}
